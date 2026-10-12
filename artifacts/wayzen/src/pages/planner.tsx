import { useState } from 'react';
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
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { useTripCreate } from '@/hooks/use-trip-create';
import { interestsList } from '@/lib/constants';
import { showErrorText } from '@/lib/errors';
import { getAnonymousId, safeRead, saveLocal, useLocalSet } from '@/lib/storage';

type PlannerValues = {
  days: number;
  interests: string[];
  region: string;
  pace: 'slow' | 'balanced' | 'packed';
  budget: 'budget' | 'moderate' | 'comfort';
};

function routeQuotaCopy(args: {
  isSignedIn: boolean;
  used?: number;
  limit?: number;
  remainingFromRoute?: number;
}): string {
  const { isSignedIn, used, limit, remainingFromRoute } = args;
  if (!isSignedIn) {
    return 'Гостевой доступ: 1 AI-маршрут за день по Самарканду (как Free). После генерации можно сохранить поездку локально.';
  }
  if (limit === undefined || used === undefined) {
    return 'Лимит AI-маршрутов зависит от плана аккаунта.';
  }
  if (limit === -1) {
    return 'Trip Pass: AI-маршруты без дневного лимита.';
  }
  const remaining = remainingFromRoute ?? Math.max(limit - used, 0);
  return `Free: осталось ${remaining} из ${limit} AI-маршрутов сегодня (день по Самарканду). Уже использовано: ${used}.`;
}

export function Planner() {
  const form = useForm<PlannerValues>({
    defaultValues: { days: 2, interests: ['Природа'], region: '', pace: 'slow', budget: 'moderate' },
  });
  const client = useQueryClient();
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const plannerProfile = useGetProfile({
    query: { queryKey: getGetProfileQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const generated = useGenerateAiRoute({
    mutation: {
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        setSaveStatus('idle');
        setSaveMessage('');
      },
    },
  });
  const createTrip = useTripCreate({
    onSuccess: (trip) => {
      setSaveStatus('saved');
      setSaveMessage('Поездка сохранена — открываем…');
      setLocation(`/trips/${trip.id}`);
    },
    onError: (error) => {
      setSaveStatus('error');
      setSaveMessage(showErrorText(error));
    },
  });
  const localStops = useLocalSet('wayzen-planner-stops');
  const places = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey() } });
  const route = generated.data as GeneratedRoute | undefined;
  const limit = plannerProfile.data?.aiRoutesLimit;
  const used = plannerProfile.data?.aiRoutesUsedToday;
  const remainingFromProfile =
    limit === undefined || used === undefined || limit === -1
      ? undefined
      : Math.max(limit - used, 0);
  const remainingRoutes =
    route?.remainingRoutesToday !== undefined && route.remainingRoutesToday >= 0
      ? route.remainingRoutesToday
      : remainingFromProfile;
  const quotaExhausted =
    Boolean(isSignedIn) && limit !== undefined && limit !== -1 && (remainingRoutes ?? 0) <= 0 && !route;
  const quotaText = routeQuotaCopy({
    isSignedIn: Boolean(isSignedIn),
    used,
    limit,
    remainingFromRoute: route?.remainingRoutesToday,
  });

  const submit = form.handleSubmit((values) =>
    generated.mutate({
      data: {
        days: Number(values.days),
        interests: values.interests,
        ...(values.region ? { region: values.region } : {}),
        pace: values.pace,
        budget: values.budget,
        ...(!isSignedIn ? { anonymousId: getAnonymousId() } : {}),
      },
    }),
  );

  const saveRoute = () => {
    if (!route || createTrip.loading || saveStatus === 'saved') return;
    const data: TripInput = { title: route.title, notes: route.disclaimer, days: route.days };
    if (isSignedIn) {
      createTrip.mutate(data);
      return;
    }
    const localTrips = safeRead<Trip[]>('wayzen-local-trips', []);
    const now = new Date().toISOString();
    const localTrip: Trip = {
      ...data,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    saveLocal('wayzen-local-trips', [localTrip, ...localTrips]);
    localStops.setValues(route.days.flatMap((day) => day.stops.map((stop) => stop.placeSlug)));
    setSaveStatus('saved');
    setSaveMessage('Поездка сохранена на этом устройстве.');
    setLocation(`/trips/${localTrip.id}`);
  };

  return (
    <main className="wrap">
      <div className="intro">
        <span className="eyebrow">Маршрутный стол</span>
        <h1 className="display">Соберите поездку, не угадывая.</h1>
        <p>
          WayZen предложит последовательность остановок по архиву. Любые примерные минуты не являются
          подтверждённым временем в пути или планом доступа.
        </p>
      </div>
      <ArchiveNotice />
      <div className="planner-layout" style={{ marginTop: 19 }}>
        <section className="panel route-panel">
          <h2>Пожелания к поездке</h2>
          <p>Параметры помогают составить идею, а не бронирование или подтверждённый маршрут.</p>
          <p className="quota-line" data-testid="text-route-quota-inline" role="status">
            <strong>Остаток квоты:</strong> {quotaText}
          </p>
          <Form {...form}>
            <form onSubmit={submit} data-testid="form-generate-route">
              <div className="form-grid">
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem className="field-label">
                      <FormLabel>Дней · от 1 до 7</FormLabel>
                      <FormControl>
                        <input
                          className="field"
                          type="number"
                          min={1}
                          max={7}
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          data-testid="input-route-days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem className="field-label">
                      <FormLabel>Область, если есть предпочтение</FormLabel>
                      <FormControl>
                        <select className="select" {...field} data-testid="select-route-region">
                          <option value="">Без фильтра</option>
                          {Array.from(new Set(places.data?.map((place) => place.region) ?? [])).map(
                            (item) => (
                              <option key={item}>{item}</option>
                            ),
                          )}
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pace"
                  render={({ field }) => (
                    <FormItem className="field-label">
                      <FormLabel>Темп поездки</FormLabel>
                      <FormControl>
                        <select className="select" {...field} data-testid="select-route-pace">
                          <option value="slow">Неторопливый</option>
                          <option value="balanced">Сбалансированный</option>
                          <option value="packed">Насыщенный</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem className="field-label">
                      <FormLabel>Бюджетный профиль</FormLabel>
                      <FormControl>
                        <select className="select" {...field} data-testid="select-route-budget">
                          <option value="budget">Бюджетный</option>
                          <option value="moderate">Умеренный</option>
                          <option value="comfort">Комфорт</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem className="field-label">
                    <FormLabel>Интересы</FormLabel>
                    <div className="check-row">
                      {interestsList.map((item) => (
                        <label key={item} className="check-chip">
                          <input
                            type="checkbox"
                            checked={field.value.includes(item)}
                            onChange={(event) =>
                              field.onChange(
                                event.target.checked
                                  ? [...field.value, item]
                                  : field.value.filter((value) => value !== item),
                              )
                            }
                            data-testid={`check-interest-${item}`}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              <button
                className="btn btn-primary"
                style={{ marginTop: 18 }}
                type="submit"
                disabled={generated.isPending || quotaExhausted}
                data-testid="button-generate-route"
              >
                {generated.isPending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {quotaExhausted ? 'Лимит на сегодня исчерпан' : 'Предложить маршрут'}
              </button>
            </form>
          </Form>
          {generated.isError && (
            <div style={{ marginTop: 14 }}>
              <LoadError error={generated.error} onRetry={() => void submit()} />
            </div>
          )}
          {route && (
            <section className="day-card" data-testid="generated-route">
              <div className="section-head" style={{ marginBottom: 9 }}>
                <div>
                  <span className="eyebrow">Черновая идея</span>
                  <h3 style={{ marginTop: 6 }}>{route.title}</h3>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={saveRoute}
                  disabled={createTrip.loading || saveStatus === 'saved'}
                  data-testid="button-save-generated-trip"
                >
                  <Bookmark size={15} />
                  {createTrip.loading
                    ? 'Сохраняем…'
                    : saveStatus === 'saved'
                      ? 'Сохранено'
                      : 'Сохранить как поездку'}
                </button>
              </div>
              <p className="quota-line" data-testid="text-route-remaining" role="status">
                {route.remainingRoutesToday < 0
                  ? 'После генерации: Trip Pass — дневного лимита нет.'
                  : `После генерации осталось AI-маршрутов сегодня: ${route.remainingRoutesToday}.`}
              </p>
              {saveMessage && (
                <p
                  data-testid="status-save-generated-trip"
                  role="status"
                  style={{
                    margin: '0 0 10px',
                    color: saveStatus === 'error' ? '#8b3a2f' : '#2d6656',
                    fontSize: 13,
                  }}
                >
                  {saveMessage}
                </p>
              )}
              {route.days.map((day) => (
                <DayStops key={day.day} day={day} places={places.data ?? []} />
              ))}
              <p data-testid="text-route-disclaimer">
                <strong>Уточнение:</strong> {route.disclaimer} Указанное время не подтверждает точное
                время в пути.
              </p>
              <span className="unverified">
                Примерная длительность: {route.approximateTotalMinutes} мин · оценка, не расписание
              </span>
            </section>
          )}
          {!route && !generated.isPending && (
            <EmptyState
              icon={<Compass size={21} />}
              title="Маршрут начнётся с ваших интересов"
              copy="Настройте пожелания выше. WayZen создаст предварительный план из доступных архивных записей."
            />
          )}
        </section>
        <aside className="panel">
          <span className="eyebrow">Без ложных обещаний</span>
          <h3 style={{ marginTop: 8 }}>План — только отправная точка.</h3>
          <p>
            Минуты и порядок — приблизительная оценка, не навигация. Актуальные условия, часы или
            стоимость неизвестны.
          </p>
          <p className="quota-line" data-testid="text-route-quota" role="status">
            <strong>{quotaText}</strong>
          </p>
          <ArchiveNotice compact />
          <div style={{ marginTop: 15 }}>
            <Link className="btn btn-quiet" href="/places" data-testid="link-planner-catalog">
              Выбрать места вручную <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </div>
      <Footer />
    </main>
  );
}
