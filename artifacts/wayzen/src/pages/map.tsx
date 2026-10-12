import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getListPlacesQueryKey, useListPlaces } from '@workspace/api-client-react';
import type { Place } from '@workspace/api-client-react';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { basePath, categoryNames } from '@/lib/constants';
import { placeName } from '@/lib/place';

function MapFocus({ place }: { place?: Place }) {
  const map = useMap();
  useEffect(() => { if (place) map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 8), { duration: .65 }); }, [place, map]);
  return null;
}

export function MapPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), ...(category ? { category } : {}), ...(region ? { region } : {}) }), [search, category, region]);
  const places = useListPlaces(params, { query: { queryKey: getListPlacesQueryKey(params) } });
  const selected = places.data?.find(place => place.slug === selectedSlug);
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Географический ориентир</span><h1 className="display">Найти место на карте.</h1><p>Реальная интерактивная карта с архивными координатами. Точки помогают увидеть расположение, но не показывают маршрут, доступ или условия посещения.</p></div>
    <ArchiveNotice compact />
    <div className="map-page" style={{ marginTop: 18 }}>
      <aside className="map-panel">
        <div className="search-field"><Search size={16} /><input className="field" value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти в архиве" aria-label="Поиск на карте" data-testid="input-map-search" /></div>
        <select className="select" value={category} onChange={event => setCategory(event.target.value)} aria-label="Фильтр по категории" data-testid="select-map-category"><option value="">Все категории</option>{Array.from(new Set(places.data?.map(place => place.category) ?? [])).map(option => <option key={option}>{option}</option>)}</select>
        <select className="select" value={region} onChange={event => setRegion(event.target.value)} aria-label="Фильтр по области" data-testid="select-map-region"><option value="">Все области</option>{Array.from(new Set(places.data?.map(place => place.region) ?? [])).map(option => <option key={option}>{option}</option>)}</select>
        <div className="map-results" data-testid="map-place-list">
          {places.isLoading ? <div className="skeleton" style={{ height: 110 }} /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
            places.data?.length ? places.data.map(place => <button className={`map-row ${selectedSlug === place.slug ? 'selected' : ''}`} key={place.slug} onClick={() => setSelectedSlug(place.slug)} data-testid={`map-list-${place.slug}`}><i className="map-dot" /><span className="map-row-copy"><strong>{placeName(place)}</strong><span>{place.region} · {categoryNames[place.category] ?? place.category}</span></span><ChevronRight size={15} /></button>) :
              <EmptyState icon={<MapPin size={20} />} title="Нет точек" copy="Измените поиск или фильтры." />}
        </div>
      </aside>
      <section className="map-canvas" aria-label="Карта Узбекистана и мест архива" data-testid="interactive-map">
        <MapContainer center={[41.1, 64.4]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', minHeight: 600, width: '100%', zIndex: 1 }} attributionControl>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFocus place={selected} />
          {places.data?.map(place => <CircleMarker key={place.slug} center={[place.latitude, place.longitude]} radius={selectedSlug === place.slug ? 9 : 6} pathOptions={{ color: '#fff8e8', weight: 2, fillColor: selectedSlug === place.slug ? '#b55f45' : '#1c6556', fillOpacity: .95 }} eventHandlers={{ click: () => setSelectedSlug(place.slug) }}><Popup><strong>{placeName(place)}</strong><br />{place.region}<br /><a href={`${basePath}/place/${place.slug}`}>Открыть запись</a></Popup></CircleMarker>)}
        </MapContainer>
        <div className="map-disclaimer" data-testid="text-map-caveat">Архивные координаты — только ориентир. Проверяйте доступ и условия самостоятельно; WayZen не сообщает точное время в пути.</div>
      </section>
    </div><Footer />
  </main>;
}
