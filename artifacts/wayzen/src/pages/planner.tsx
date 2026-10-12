import { ArrowRight, Bookmark, Compass, LoaderCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetProfileQueryKey, getListPlacesQueryKey,
  useGenerateAiRoute, useGetProfile, useListPlaces,
} from '@workspace/api-client-react';
import type { GeneratedRoute, Trip, TripInput } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { DayStops } from '@/components/DayStops';
import { LoadError } from '@/components/LoadError';
import { useTripCreate } from '@/hooks/use-trip-create';
import { interestsList } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import { getAnonymousId, safeRead, saveLocal, useLocalSet } from '@/lib/storage';

type PlannerValues = { days: number; interests: string[]; region: string; pace: 'slow' | 'balanced' | 'packed'; budget: 'budget' | 'moderate' | 'comfort' };

export function Planner() {
  const { t } = useI18n();
  const form = useForm<PlannerValues>({ defaultValues: { days: 2, interests: ['Природа'], region: '', pace: 'slow', budget: 'moderate' } });
  const client = useQueryClient();
  const [, setLocation] = useLocation();
  const generated = useGenerateAiRoute({
    mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getGetProfileQueryKey() }) },
  });
  const createTrip = useTripCreate({
    onSuccess: (trip) => setLocation(`/trips/${trip.id}`),
  });
  const { isSignedIn } = useAuth();
  const plannerProfile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: Boolean(isSignedIn) } });
  const localStops = useLocalSet('wayzen-planner-stops');
  const places = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey() } });
  const route = generated.data as GeneratedRoute | undefined;
  const stopCount = route?.days.reduce((sum, day) => sum + day.stops.length, 0) ?? localStops.values.length;

  const submit = form.handleSubmit(values => generated.mutate({
    data: {
      days: Number(values.days),
      interests: values.interests,
      ...(values.region ? { region: values.region } : {}),
      pace: values.pace,
      budget: values.budget,
      ...(!isSignedIn ? { anonymousId: getAnonymousId() } : {}),
    },
  }));

  const saveRoute = () => {
    if (!route) return;
    const data: TripInput = { title: route.title, notes: route.disclaimer, days: route.days };
    if (isSignedIn) createTrip.mutate(data); else {
      const localTrips = safeRead<Trip[]>('wayzen-local-trips', []);
      const now = new Date().toISOString();
      const localTrip: Trip = { ...data, id: Date.now(), createdAt: now, updatedAt: now };
      saveLocal('wayzen-local-trips', [localTrip, ...localTrips]);
      localStops.setValues(route.days.flatMap(day => day.stops.map(stop => stop.placeSlug)));
      setLocation(`/trips/${localTrip.id}`);
    }
  };

  return (
    <main className="wz-page" data-testid="page-planner">
      <div className="wz-intro">
        <span className="wz-kicker">{t('planner.kicker')}</span>
        <h1>{t('planner.title')}</h1>
        <p>{t('planner.lead')}</p>
      </div>
      <ArchiveNotice />

      <div className="wz-planner-grid">
        <section className="wz-panel">
          <span className="wz-kicker">{t('planner.planKicker')}</span>
          <h2>{t('planner.stops', { n: stopCount })}</h2>
          {route ? (
            <div data-testid="generated-route">
              <div className="section-head" style={{ marginBottom: 9 }}>
                <div><h3 style={{ marginTop: 6 }}>{route.title}</h3></div>
                <button className="btn btn-quiet" type="button" onClick={saveRoute} disabled={createTrip.loading} data-testid="button-save-generated-trip">
                  <Bookmark size={15} />{createTrip.loading ? t('planner.saving') : t('planner.save')}
                </button>
              </div>
              {route.days.map(day => <DayStops key={day.day} day={day} places={places.data ?? []} />)}
            </div>
          ) : (
            <div className="wz-empty-panel">
              <div className="empty-icon"><Compass size={22} /></div>
              <h3>{t('planner.emptyTitle')}</h3>
              <p>{t('planner.emptyCopy')}</p>
              <Link className="btn btn-quiet" href="/places" data-testid="link-planner-catalog">{t('planner.choosePlaces')}</Link>
            </div>
          )}
          {generated.isError && <div style={{ marginTop: 14 }}><LoadError error={generated.error} onRetry={() => void submit()} /></div>}
        </section>

        <aside className="wz-panel wz-idea-panel">
          <span className="wz-kicker">{t('planner.ideaKicker')}</span>
          <h2>{t('planner.ideaTitle')}</h2>
          <Form {...form}>
            <form onSubmit={submit} data-testid="form-generate-route" className="wz-idea-form">
              <FormField control={form.control} name="interests" render={({ field }) => (
                <FormItem className="field-label">
                  <FormLabel>{t('planner.interest')}</FormLabel>
                  <FormControl>
                    <select
                      className="select"
                      value={field.value[0] ?? ''}
                      onChange={event => field.onChange(event.target.value ? [event.target.value] : [])}
                      data-testid="select-route-interest"
                    >
                      {interestsList.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="region" render={({ field }) => (
                <FormItem className="field-label">
                  <FormLabel>{t('planner.region')}</FormLabel>
                  <FormControl>
                    <select className="select" {...field} data-testid="select-route-region">
                      <option value="">{t('planner.allRegions')}</option>
                      {Array.from(new Set(places.data?.map(place => place.region) ?? [])).map(item => <option key={item}>{item}</option>)}
                    </select>
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="days" render={({ field }) => (
                <FormItem className="field-label">
                  <FormLabel>{t('planner.days')}</FormLabel>
                  <FormControl>
                    <input className="field" type="number" min={1} max={7} {...field} onChange={event => field.onChange(Number(event.target.value))} data-testid="input-route-days" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <button className="btn btn-primary" type="submit" disabled={generated.isPending} data-testid="button-generate-route">
                {generated.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {t('planner.suggest')}
              </button>
            </form>
          </Form>
          <p data-testid="text-route-quota">
            <strong>{plannerProfile.data?.aiRoutesLimit === -1 ? t('planner.quotaPass') : t('planner.quotaFree')}</strong>
            {plannerProfile.data && plannerProfile.data.aiRoutesLimit !== -1 ? ` · ${plannerProfile.data.aiRoutesUsedToday}/${plannerProfile.data.aiRoutesLimit}` : ''}
          </p>
          <Link className="wz-text-link" href="/places" data-testid="link-planner-manual">{t('planner.manual')} <ArrowRight size={14} /></Link>
        </aside>
      </div>
    </main>
  );
}
