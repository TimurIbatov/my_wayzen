import { ArrowRight, Heart } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { getListPlacesQueryKey, useListPlaces } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { LoadingCards } from '@/components/LoadingCards';
import { PlaceCard } from '@/components/PlaceCard';
import { useFavoritesState } from '@/hooks/use-favorites';

export function Favorites() {
  const { isSignedIn } = useAuth();
  const favorites = useFavoritesState();
  const places = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey() } });
  const saved = places.data?.filter(place => favorites.values.includes(place.slug)) ?? [];
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Под рукой</span><h1 className="display">Ваши сохранённые места.</h1><p>{isSignedIn ? 'Избранное синхронизируется с аккаунтом.' : 'Гостевое избранное хранится в браузере на этом устройстве.'}</p></div>
    <ArchiveNotice compact />
    {favorites.loading || places.isLoading ? <LoadingCards count={3} /> : favorites.error ? <LoadError error={favorites.error} onRetry={favorites.retry} /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
      saved.length ? <section className="section"><div className="place-grid">{saved.map((place, i) => <PlaceCard key={place.slug} place={place} index={i} saved onSave={() => favorites.toggle(place.slug)} />)}</div></section> :
        <div style={{ marginTop: 20 }}><EmptyState icon={<Heart size={22} />} title="Пока ничего не сохранено" copy="Откройте каталог и добавьте места, которые хотите изучить." action={<Link className="btn btn-primary" href="/places">Найти места <ArrowRight size={15} /></Link>} /></div>}
    <Footer />
  </main>;
}
