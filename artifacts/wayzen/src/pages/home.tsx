import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '@clerk/react';
import {
  getGetOverviewQueryKey, getListPlacesQueryKey,
  useGetOverview, useListPlaces,
} from '@workspace/api-client-react';
import { Link, Redirect } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { LoadingCards } from '@/components/LoadingCards';
import { PlaceCard } from '@/components/PlaceCard';
import { useFavoritesState } from '@/hooks/use-favorites';

export function Home() {
  const overview = useGetOverview({ query: { queryKey: getGetOverviewQueryKey() } });
  const places = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey(), staleTime: 45_000 } });
  const { isSignedIn } = useAuth();
  const featured = overview.data?.featuredPlaces?.length ? overview.data.featuredPlaces : places.data?.slice(0, 3) ?? [];
  const favorites = useFavoritesState();
  return <main className="wrap">
    <section className="hero" data-testid="home-hero">
      <img src={`${import.meta.env.BASE_URL}uzbekistan-dusk.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -2, opacity: .55, mixBlendMode: 'soft-light' }} />
      <div className="hero-copy"><span className="eyebrow">Узбекистан · собственным маршрутом</span>
        <h1>Ближе к тихой<br /><em>стороне страны.</em></h1>
        <p>Ищите места за пределами очевидного маршрута. Узнавайте истории, сохраняйте находки и превращайте их в поездку, которую удобно спланировать самому.</p>
        <div className="hero-actions"><Link className="btn btn-primary" href="/places" data-testid="link-explore-places">Открыть атлас <ArrowRight size={16} /></Link><Link className="btn btn-quiet" href="/planner" data-testid="link-start-planner">Собрать поездку <Sparkles size={16} /></Link></div>
      </div>
      <span className="hero-stamp">AN OPEN ARCHIVE · UZBEKISTAN</span>
    </section>
    <div style={{ marginTop: 20 }}><ArchiveNotice compact /></div>
    <section className="section">
      <div className="section-head"><div><span className="eyebrow">Начните с любопытства</span><h2>Несколько мест из архива</h2></div><Link href="/places" className="btn btn-quiet" data-testid="link-all-places">Все места <ArrowRight size={15} /></Link></div>
      {places.isLoading ? <LoadingCards count={3} /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
        featured.length ? <div className="place-grid">{featured.map((place, i) => <PlaceCard key={place.slug} place={place} index={i} saved={favorites.values.includes(place.slug)} onSave={() => favorites.toggle(place.slug)} />)}</div> :
          <EmptyState icon={<MapPin size={22} />} title="Каталог пока пуст" copy="Когда архивные записи появятся в каталоге, они будут доступны здесь." />}
    </section>
    <section className="feature-band"><div><span className="eyebrow">Не готовый тур. Хорошая отправная точка.</span><h2>Собирайте идеи. Проверяйте детали сами.</h2><p>WayZen помогает ориентироваться в предварительной подборке мест, но не подменяет актуальные местные источники. Маршруты показывают порядок остановок, а не подтверждённый график поездки.</p></div><div className="feature-actions"><Link href="/map" className="btn btn-quiet" data-testid="link-home-map">Смотреть карту</Link><Link href="/trips" className="btn btn-quiet" data-testid="link-home-trips">Мои поездки</Link><Link href="/ai" className="btn btn-primary" data-testid="link-home-ai">Спросить AI-гид <ArrowRight size={15} /></Link></div></section>
    <Footer />
    {isSignedIn && <Redirect to="/user-portal" />}
  </main>;
}

export function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/user-portal" />;
  return <Home />;
}
