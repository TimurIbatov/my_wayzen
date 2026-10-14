import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getListPlacesQueryKey, useListPlaces } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { LoadError } from '@/components/LoadError';
import { LoadingCards } from '@/components/LoadingCards';
import { PlaceCard } from '@/components/PlaceCard';
import { useFavoritesState } from '@/hooks/use-favorites';
import { useI18n } from '@/lib/i18n';

export function Favorites() {
  const { t } = useI18n();
  const { isSignedIn } = useAuth();
  const favorites = useFavoritesState();
  const places = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey() } });
  const saved = places.data?.filter(place => favorites.values.includes(place.slug)) ?? [];

  return (
    <main className="wz-page" data-testid="page-favorites">
      <div className="wz-intro">
        <span className="wz-kicker">{isSignedIn ? t('favorites.kickerSigned') : t('favorites.kicker')}</span>
        <h1>{t('favorites.title')}</h1>
        <p>{isSignedIn ? t('favorites.leadSigned') : t('favorites.leadGuest')}</p>
      </div>
      <ArchiveNotice />
      <div className="wz-intro" style={{ paddingTop: 28 }}>
        <span className="wz-kicker">{t('favorites.listKicker')}</span>
        <h2 style={{ margin: '8px 0 0', font: '600 clamp(28px,4vw,40px)/1.05 var(--app-font-sans)' }}>{t('favorites.want', { n: saved.length })}</h2>
      </div>
      {favorites.loading || places.isLoading ? <LoadingCards count={3} /> : favorites.error ? <LoadError error={favorites.error} onRetry={favorites.retry} /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
        saved.length ? (
          <section className="section" style={{ paddingTop: 18 }}>
            <div className="place-grid">{saved.map((place, i) => <PlaceCard key={place.slug} place={place} index={i} saved onSave={() => favorites.toggle(place.slug)} />)}</div>
          </section>
        ) : (
          <div className="wz-empty-panel" style={{ marginTop: 12 }}>
            <div className="empty-icon"><Heart size={22} /></div>
            <h3>{t('favorites.emptyTitle')}</h3>
            <p>{t('favorites.emptyCopy')}</p>
            <Link className="btn btn-primary" href="/places" data-testid="link-favorites-catalog">{t('favorites.find')}</Link>
          </div>
        )}
    </main>
  );
}
