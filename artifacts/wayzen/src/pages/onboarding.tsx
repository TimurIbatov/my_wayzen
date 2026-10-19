import { useEffect } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { getGetProfileQueryKey, useGetProfile, useUpdateProfile } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { interestsList } from '@/lib/constants';
import type { ProfileForm } from '@/pages/profile';

export function Onboarding() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: Boolean(isSignedIn) } });
  const update = useUpdateProfile({ mutation: { onSuccess: () => { void client.invalidateQueries({ queryKey: getGetProfileQueryKey() }); setLocation('/user-portal'); } } });
  const form = useForm<ProfileForm>({ defaultValues: { interests: [], pace: 'slow', budget: 'moderate', travelStyle: '' } });
  useEffect(() => { if (profile.data) form.reset({ interests: profile.data.interests, pace: profile.data.pace, budget: profile.data.budget, travelStyle: profile.data.travelStyle }); }, [profile.data?.interests.join('|'), profile.data?.pace, profile.data?.budget, profile.data?.travelStyle]);
  if (!isSignedIn) return <main className="wrap load-shell"><div className="empty"><div className="empty-icon"><Compass size={22} /></div><span className="eyebrow">Начало пути</span><h2>Сначала создайте аккаунт.</h2><p>Подбор предпочтений привяжется к вашему WayZen-профилю. Каталог остаётся доступным без входа.</p><Link className="btn btn-primary" href="/sign-up" data-testid="link-onboarding-sign-up">Создать аккаунт <ArrowRight size={15} /></Link></div></main>;
  if (profile.isLoading) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 360, borderRadius: 20 }} /></main>;
  if (profile.isError) return <main className="wrap load-shell"><LoadError error={profile.error} onRetry={() => void profile.refetch()} /></main>;
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">01 / 01 · Знакомство</span><h1 className="display">Как вы любите путешествовать?</h1><p>Выберите несколько ориентиров — их всегда можно изменить позже. WayZen использует их для генерации идей и ничего не обещает о фактической доступности.</p></div>
    <div className="profile-grid"><section className="panel"><Form {...form}><form onSubmit={form.handleSubmit(values => update.mutate({ data: values }))} data-testid="form-onboarding">
      <FormField control={form.control} name="interests" render={({ field }) => <FormItem className="field-label"><FormLabel>Что вас притягивает?</FormLabel><div className="check-row">{interestsList.map(item => <label className="check-chip" key={item}><input type="checkbox" checked={field.value.includes(item)} onChange={event => field.onChange(event.target.checked ? [...field.value, item] : field.value.filter(value => value !== item))} data-testid={`onboarding-interest-${item}`} />{item}</label>)}</div></FormItem>} />
      <div className="form-grid"><FormField control={form.control} name="pace" render={({ field }) => <FormItem className="field-label"><FormLabel>Ваш темп</FormLabel><FormControl><select className="select" {...field} data-testid="onboarding-pace"><option value="slow">Медленный</option><option value="balanced">Сбалансированный</option><option value="packed">Насыщенный</option></select></FormControl></FormItem>} /><FormField control={form.control} name="budget" render={({ field }) => <FormItem className="field-label"><FormLabel>Предпочтение бюджета</FormLabel><FormControl><select className="select" {...field} data-testid="onboarding-budget"><option value="budget">Бюджетный</option><option value="moderate">Умеренный</option><option value="comfort">Комфорт</option></select></FormControl></FormItem>} /></div>
      <FormField control={form.control} name="travelStyle" render={({ field }) => <FormItem className="field-label"><FormLabel>Свободная заметка</FormLabel><FormControl><textarea className="textarea" maxLength={240} {...field} placeholder="Например: хочется больше времени на месте, меньше переездов" data-testid="onboarding-style" /></FormControl><FormMessage /></FormItem>} />
      {update.isError && <div style={{ marginTop: 12 }}><LoadError error={update.error} onRetry={() => void form.handleSubmit(values => update.mutate({ data: values }))()} /></div>}
      <div className="feature-actions" style={{ marginTop: 18 }}><Link className="btn btn-quiet" href="/places" data-testid="link-skip-onboarding">Пока пропустить</Link><button className="btn btn-primary" type="submit" disabled={update.isPending} data-testid="button-save-onboarding">{update.isPending ? 'Сохраняем…' : 'Сохранить и продолжить'}<ArrowRight size={15} /></button></div>
    </form></Form></section>
      <aside className="status-card"><span className="eyebrow">Честное начало</span><h2 style={{ font: '600 26px var(--app-font-serif)' }}>Никаких выдуманных деталей.</h2><p>Все импортированные места — предварительные. Время поездки, условия посещения, цены и часы работы нужно проверить у актуальных источников.</p><Link href="/places" className="btn btn-quiet" data-testid="link-onboarding-archive">Пока просто посмотреть <ArrowRight size={15} /></Link></aside>
    </div><Footer />
  </main>;
}
