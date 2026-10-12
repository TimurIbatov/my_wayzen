import { useMemo, useState } from 'react';
import { Map as MapIcon, Search, X } from 'lucide-react';
import { getListPlacesQueryKey, useListPlaces } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { LoadingCards } from '@/components/LoadingCards';
import { PlaceCard } from '@/components/PlaceCard';
import { useFavoritesState } from '@/hooks/use-favorites';
import { categoryNames } from '@/lib/constants';

export function Catalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const favorites = useFavoritesState();
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), ...(category ? { category } : {}), ...(region ? { region } : {}) }), [search, category, region]);
  const places = useListPlaces(params, { query: { queryKey: getListPlacesQueryKey(params), staleTime: 30_000 } });
  const categories = Array.from(new Set(places.data?.map(place => place.category) ?? []));
  const regions = Array.from(new Set(places.data?.map(place => place.region) ?? []));
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Архив WayZen · поиск</span><h1 className="display">Места для своего пути.</h1><p>Ищите по имени, региону или категории. Ни одна из 16 импортированных точек пока не подтверждена как актуальная.</p></div>
    <ArchiveNotice />
    <div className="page-grid" style={{ marginTop: 20 }}>
      <aside className="filters" aria-label="Фильтры каталога">
        <label className="field-label">Поиск<div className="search-field"><Search size={17} /><input className="field" value={search} onChange={event => setSearch(event.target.value)} placeholder="Название или ключевое слово" data-testid="input-place-search" /></div></label>
        <label className="field-label">Категория<select className="select" value={category} onChange={event => setCategory(event.target.value)} data-testid="select-category"><option value="">Все категории</option>{categories.map(value => <option key={value} value={value}>{categoryNames[value] ?? value}</option>)}</select></label>
        <label className="field-label">Область<select className="select" value={region} onChange={event => setRegion(event.target.value)} data-testid="select-region"><option value="">Все области</option>{regions.map(value => <option key={value}>{value}</option>)}</select></label>
        <button className="btn btn-quiet" onClick={() => { setSearch(''); setCategory(''); setRegion(''); }} data-testid="button-clear-filters"><X size={15} /> Сбросить фильтры</button>
      </aside>
      <section>
        <div className="results-head"><span data-testid="text-result-count">{places.data?.length ?? 0} мест в текущем поиске</span><Link href="/map" className="btn btn-quiet" data-testid="link-catalog-map"><MapIcon size={15} /> На карте</Link></div>
        {places.isLoading ? <LoadingCards /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
          places.data?.length ? <div className="results-grid">{places.data.map((place, i) => <PlaceCard key={place.slug} place={place} index={i} saved={favorites.values.includes(place.slug)} onSave={() => favorites.toggle(place.slug)} />)}</div> :
            <EmptyState icon={<Search size={22} />} title="Ничего не нашлось" copy="Попробуйте другое слово или снимите часть фильтров." action={<button className="btn btn-quiet" onClick={() => { setSearch(''); setCategory(''); setRegion(''); }} data-testid="button-reset-search">Сбросить поиск</button>} />}
      </section>
    </div>
    <Footer />
  </main>;
}
