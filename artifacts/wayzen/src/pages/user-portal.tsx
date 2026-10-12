import { ArrowRight } from 'lucide-react';
import { getGetProfileQueryKey, useGetProfile } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';

export function UserPortal() {
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), enabled: true } });
  return <main className="wrap"><div className="intro"><span className="eyebrow">Личный портал</span><h1 className="display">Ваш путь начинается здесь.</h1><p>Сохранённые поездки, личные интересы и архивные зацепки — в одном месте.</p></div>
    {profile.isLoading ? <div className="skeleton" style={{ height: 160 }} /> : profile.isError ? <LoadError error={profile.error} onRetry={() => void profile.refetch()} /> : <div className="feature-band"><div><span className="eyebrow">План аккаунта</span><h2>{profile.data?.plan === 'trip_pass' ? 'Trip Pass' : 'WayZen Free'}</h2><p>Маршруты сегодня: {profile.data?.aiRoutesLimit === -1 ? 'без лимита' : `${profile.data?.aiRoutesUsedToday ?? 0} из ${profile.data?.aiRoutesLimit ?? 1}`}. AI-чат: {profile.data?.aiChatLimit === -1 ? 'без лимита' : `${profile.data?.aiChatUsedToday ?? 0} из ${profile.data?.aiChatLimit ?? 10}`} сообщений. Идеи требуют самостоятельной проверки.</p></div><Link href="/trips" className="btn btn-primary" data-testid="link-portal-trips">Открыть поездки <ArrowRight size={15} /></Link></div>}
    <div className="section"><div className="feature-actions"><Link className="btn btn-quiet" href="/favorites">Избранное</Link><Link className="btn btn-quiet" href="/profile">Предпочтения</Link><Link className="btn btn-quiet" href="/planner">Новый план</Link></div></div><Footer />
  </main>;
}
