import { useEffect, useState } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetProfileQueryKey,
  useActivateDemoTripPass, useCreateTripPassCheckout, useGetProfile, useUpdateProfile,
} from '@workspace/api-client-react';
import type { Profile, ProfileInput } from '@workspace/api-client-react';
import { Link, useSearchParams } from 'wouter';
import { useForm } from 'react-hook-form';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { interestsList } from '@/lib/constants';

type ProfileForm = { interests: string[]; pace: 'slow' | 'balanced' | 'packed'; budget: 'budget' | 'moderate' | 'comfort'; travelStyle: string };

function formatExpiry(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Samarkand',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function ProfilePage() {
  const { isSignedIn } = useAuth();
  const client = useQueryClient();
  const [searchParams] = useSearchParams();
  const [offlinePreviewOpen, setOfflinePreviewOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: Boolean(isSignedIn), staleTime: 20_000 } });
  const update = useUpdateProfile({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getGetProfileQueryKey() }) } });
  const pass = useActivateDemoTripPass({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getGetProfileQueryKey() }) } });
  const checkout = useCreateTripPassCheckout();
  const form = useForm<ProfileForm>({ defaultValues: { interests: [], pace: 'slow', budget: 'moderate', travelStyle: '' } });
  useEffect(() => { if (profile.data) form.reset({ interests: profile.data.interests, pace: profile.data.pace, budget: profile.data.budget, travelStyle: profile.data.travelStyle }); }, [profile.data, form]);
  useEffect(() => {
    if (searchParams.get('trip_pass') === 'success') {
      void client.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    }
  }, [searchParams, client]);
  const submit = form.handleSubmit((values: ProfileInput) => update.mutate({ data: values }));
  const startCheckout = async () => {
    setCheckoutError('');
    try {
      const session = await checkout.mutateAsync();
      if (!session.url) throw new Error('Checkout URL missing.');
      window.location.assign(session.url);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && error.data !== null && 'error' in error.data && typeof (error.data as { error?: unknown }).error === 'string'
          ? (error.data as { error: string }).error
          : error instanceof Error
            ? error.message
            : 'Не удалось открыть оплату Trip Pass.';
      setCheckoutError(message);
    }
  };
  if (!isSignedIn) return <main className="wrap load-shell"><EmptyState icon={<Compass />} title="Профиль ждёт вас" copy="Войдите, чтобы сохранить предпочтения путешествий и проверить план аккаунта." action={<Link className="btn btn-primary" href="/sign-in">Войти</Link>} /></main>;
  if (profile.isLoading) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 370, borderRadius: 19 }} /></main>;
  if (profile.isError) return <main className="wrap load-shell"><LoadError error={profile.error} onRetry={() => void profile.refetch()} /></main>;
  const data = profile.data as Profile;
  const isTripPass = data.plan === 'trip_pass';
  const expiryLabel = formatExpiry(data.tripPassExpiresAt);
  const checkoutStatus = searchParams.get('trip_pass');
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Ваш WayZen</span><h1 className="display">Настройки поездок.</h1><p>Ваши предпочтения помогают формировать идеи. Мы не запрашиваем разрешения на доступ к местам и не знаем текущие условия посещения.</p></div>
    <div className="profile-grid">
      <section className="panel"><h2>Что вам интересно</h2><Form {...form}><form onSubmit={submit} data-testid="form-profile">
        <FormField control={form.control} name="interests" render={({ field }) => <FormItem className="field-label"><FormLabel>Интересы</FormLabel><div className="check-row">{interestsList.map(item => <label className="check-chip" key={item}><input type="checkbox" checked={field.value.includes(item)} onChange={event => field.onChange(event.target.checked ? [...field.value, item] : field.value.filter(value => value !== item))} data-testid={`profile-interest-${item}`} />{item}</label>)}</div></FormItem>} />
        <div className="form-grid"><FormField control={form.control} name="pace" render={({ field }) => <FormItem className="field-label"><FormLabel>Предпочтительный темп</FormLabel><FormControl><select className="select" {...field} data-testid="select-profile-pace"><option value="slow">Неторопливый</option><option value="balanced">Сбалансированный</option><option value="packed">Насыщенный</option></select></FormControl></FormItem>} /><FormField control={form.control} name="budget" render={({ field }) => <FormItem className="field-label"><FormLabel>Бюджетный профиль</FormLabel><FormControl><select className="select" {...field} data-testid="select-profile-budget"><option value="budget">Бюджетный</option><option value="moderate">Умеренный</option><option value="comfort">Комфорт</option></select></FormControl></FormItem>} /></div>
        <FormField control={form.control} name="travelStyle" render={({ field }) => <FormItem className="field-label"><FormLabel>Какой вы путешественник?</FormLabel><FormControl><textarea className="textarea" maxLength={240} {...field} placeholder="Напишите пару ориентиров, не личных данных" data-testid="input-travel-style" /></FormControl><FormMessage /></FormItem>} />
        <button className="btn btn-primary" style={{ marginTop: 18 }} type="submit" disabled={update.isPending} data-testid="button-save-profile">{update.isPending ? 'Сохраняем…' : 'Сохранить предпочтения'}</button>
      </form></Form></section>
      <aside className="status-card" data-testid="profile-plan-status">
        <span className="eyebrow">План аккаунта</span>
        <p><strong data-testid="text-plan-name">{isTripPass ? 'Trip Pass' : 'Free'}</strong></p>
        <p data-testid="text-plan-summary">
          {isTripPass
            ? `Активен${expiryLabel ? ` до ${expiryLabel}` : ''}. Дневные лимиты AI сняты.`
            : 'Бесплатный план: 1 AI-маршрут и 10 сообщений чата за день по Самарканду.'}
        </p>
        <p data-testid="text-route-quota-profile">
          AI-маршруты сегодня:{' '}
          {data.aiRoutesLimit < 0
            ? 'без дневного лимита'
            : `осталось ${Math.max(data.aiRoutesLimit - data.aiRoutesUsedToday, 0)} из ${data.aiRoutesLimit} (использовано ${data.aiRoutesUsedToday})`}
          .
        </p>
        <p data-testid="text-chat-quota-profile">
          Сообщения AI-чата сегодня:{' '}
          {data.aiChatLimit < 0
            ? 'без дневного лимита'
            : `осталось ${Math.max(data.aiChatLimit - data.aiChatUsedToday, 0)} из ${data.aiChatLimit} (использовано ${data.aiChatUsedToday})`}
          .
        </p>
        <p>Роль модератора: {data.isAdmin ? 'есть' : 'нет'}</p>
        {checkoutStatus === 'success' && <p role="status" data-testid="status-trip-pass-success">Оплата прошла. Если план ещё Free — обновите страницу после webhook Stripe.</p>}
        {checkoutStatus === 'cancelled' && <p role="status" data-testid="status-trip-pass-cancelled">Оплата отменена. План не изменён.</p>}

        {!isTripPass && !import.meta.env.DEV && (
          <div style={{ marginTop: 18, borderTop: '1px solid rgba(48,83,68,.2)', paddingTop: 15 }}>
            <button className="btn btn-warm" type="button" onClick={() => void startCheckout()} disabled={checkout.isPending} data-testid="button-upgrade-trip-pass">
              {checkout.isPending ? 'Открываем оплату…' : 'Upgrade to Trip Pass'}
            </button>
            <p>Оплата через Stripe Checkout. Ключи и цены задаются только через env (`STRIPE_*`).</p>
            {checkoutError && <p role="alert" data-testid="status-checkout-error">{checkoutError}</p>}
          </div>
        )}

        {isTripPass && (
          <div style={{ marginTop: 14 }}>
            {data.offlineMapsEnabled ? (
              <>
                <button className="btn btn-quiet" type="button" onClick={() => setOfflinePreviewOpen(open => !open)} aria-expanded={offlinePreviewOpen} data-testid="button-offline-preview">Офлайн-карты</button>
                {offlinePreviewOpen && (
                  <div role="status" data-testid="offline-map-stub" style={{ marginTop: 10, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.52)' }}>
                    <strong>Заглушка функции</strong>
                    <p style={{ marginBottom: 0 }}>Пакеты карт и офлайн-навигация не реализованы. Загрузка не запускается — это только предпросмотр интерфейса (`OFFLINE_MAPS_ENABLED`).</p>
                  </div>
                )}
              </>
            ) : (
              <p data-testid="text-offline-maps-disabled" style={{ marginBottom: 0 }}>Офлайн-карты отключены feature-флагом. Скачивание недоступно.</p>
            )}
          </div>
        )}

        {import.meta.env.DEV && (
          <div style={{ marginTop: 18, borderTop: '1px solid rgba(48,83,68,.2)', paddingTop: 15 }}>
            <button className="btn btn-warm" onClick={() => pass.mutate()} disabled={pass.isPending} data-testid="button-test-trip-pass">{pass.isPending ? 'Тестируем…' : 'Тестовый Trip Pass'}</button>
            <p>Только DEV (`/me/trip-pass/demo`). Это не оплата и не реальная покупка.</p>
            {!isTripPass && (
              <button className="btn btn-quiet" style={{ marginTop: 10 }} type="button" onClick={() => void startCheckout()} disabled={checkout.isPending} data-testid="button-upgrade-trip-pass-dev">
                {checkout.isPending ? 'Checkout…' : 'Stripe Checkout (если настроен)'}
              </button>
            )}
            {checkoutError && <p role="alert" data-testid="status-checkout-error">{checkoutError}</p>}
          </div>
        )}
        {data.isAdmin && <Link href="/admin/places" className="btn btn-quiet" data-testid="link-admin">Модерация архива <ArrowRight size={15} /></Link>}
      </aside>
    </div><Footer />
  </main>;
}

export type { ProfileForm };
