import { useMemo, useState } from 'react';
import { Heart, Map as MapIcon, Search, X } from 'lucide-react';
import { getListPlacesQueryKey, useListPlaces } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { LoadError } from '@/components/LoadError';
import { LoadingCards } from '@/components/LoadingCards';
import { useFavoritesState } from '@/hooks/use-favorites';
import { categoryNames } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import { placeName } from '@/lib/place';

export function Catalog() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const favorites = useFavoritesState();
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), ...(category ? { category } : {}), ...(region ? { region } : {}) }), [search, category, region]);
  const places = useListPlaces(params, { query: { queryKey: getListPlacesQueryKey(params), staleTime: 30_000 } });
  const categories = Array.from(new Set(places.data?.map(place => place.category) ?? []));
  const regions = Array.from(new Set(places.data?.map(place => place.region) ?? []));
  const count = places.data?.length ?? 0;

  return (
    <main className="wz-page" data-testid="page-catalog">
      <div className="wz-intro">
        <span className="wz-kicker">{t('catalog.kicker')}</span>
        <h1>{t('catalog.title')}</h1>
        <p>{t('catalog.lead')}</p>
      </div>
      <ArchiveNotice />

      <div className="wz-filter-bar" aria-label={t('catalog.search')}>
        <label className="wz-search">
          <Search size={17} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('catalog.search')} data-testid="input-place-search" />
        </label>
        <select className="select" value={category} onChange={event => setCategory(event.target.value)} data-testid="select-category">
          <option value="">{t('catalog.allPlaces')}</option>
          {categories.map(value => <option key={value} value={value}>{categoryNames[value] ?? value}</option>)}
        </select>
        <select className="select" value={region} onChange={event => setRegion(event.target.value)} data-testid="select-region">
          <option value="">{t('catalog.allRegions')}</option>
          {regions.map(value => <option key={value}>{value}</option>)}
        </select>
        {(search || category || region) && (
          <button className="btn btn-quiet" type="button" onClick={() => { setSearch(''); setCategory(''); setRegion(''); }} data-testid="button-clear-filters">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="wz-catalog-grid">
        <section className="wz-schema-card" aria-label={t('catalog.mapTitle')}>
          <div className="wz-schema-head">
            <div>
              <span className="wz-kicker">{t('catalog.mapSchema')}</span>
              <h2>{t('catalog.mapTitle')}</h2>
            </div>
            <Link href="/map" className="btn btn-quiet" data-testid="link-catalog-map"><MapIcon size={15} />{t('catalog.onMap')}</Link>
          </div>
          <div className="wz-schema-art" aria-hidden>
            <span className="dot d1" /><span className="dot d2" /><span className="dot d3" /><span className="dot d4" /><span className="dot d5" />
          </div>
          <footer>{t('catalog.mapFoot')}</footer>
        </section>

        <section>
          <div className="results-head">
            <span data-testid="text-result-count">{t('catalog.count', { n: count })}</span>
          </div>
          {places.isLoading ? <LoadingCards /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
            places.data?.length ? (
              <div className="wz-place-list">
                {places.data.map(place => (
                  <Link key={place.slug} href={`/place/${place.slug}`} className="wz-place-row" data-testid={`link-place-${place.slug}`}>
                    <span className="wz-thumb art-fallback art-1" aria-hidden />
                    <span className="wz-place-copy">
                      <strong>{placeName(place)}</strong>
                      <span>{categoryNames[place.category] ?? place.category} · {place.region}</span>
                    </span>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label="favorite"
                      data-testid={`button-favorite-${place.slug}`}
                      onClick={event => { event.preventDefault(); favorites.toggle(place.slug); }}
                    >
                      <Heart size={15} fill={favorites.values.includes(place.slug) ? 'currentColor' : 'none'} />
                    </button>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Search size={22} />}
                title={t('catalog.emptyTitle')}
                copy={t('catalog.emptyCopy')}
                action={<button className="btn btn-quiet" type="button" onClick={() => { setSearch(''); setCategory(''); setRegion(''); }} data-testid="button-reset-search">{t('catalog.reset')}</button>}
              />
            )}
        </section>
      </div>
    </main>
  );
}
