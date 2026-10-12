import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, Search } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {
  getGetTripQueryKey, getListPlacesQueryKey,
  useGetTrip, useListPlaces,
} from '@workspace/api-client-react';
import type { Place, Trip } from '@workspace/api-client-react';
import { useAuth } from '@clerk/react';
import { useSearchParams } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { basePath, categoryNames } from '@/lib/constants';
import { placeName } from '@/lib/place';
import { safeRead } from '@/lib/storage';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char
  ));
}

function MapFocus({ place }: { place?: Place }) {
  const map = useMap();
  useEffect(() => { if (place) map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 8), { duration: .65 }); }, [place, map]);
  return null;
}

function PlaceClusters({
  places,
  selectedSlug,
  onSelect,
}: {
  places: Place[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 52,
      spiderfyOnEveryZoom: false,
      disableClusteringAtZoom: 12,
      iconCreateFunction(cluster) {
        const count = cluster.getChildCount();
        const size = count < 8 ? 'sm' : count < 20 ? 'md' : 'lg';
        return L.divIcon({
          html: `<span>${count}</span>`,
          className: `wayzen-cluster wayzen-cluster-${size}`,
          iconSize: L.point(size === 'lg' ? 46 : size === 'md' ? 40 : 34, size === 'lg' ? 46 : size === 'md' ? 40 : 34),
        });
      },
    });
    for (const place of places) {
      const selected = selectedSlug === place.slug;
      const marker = L.circleMarker([place.latitude, place.longitude], {
        radius: selected ? 9 : 6,
        color: '#fff8e8',
        weight: 2,
        fillColor: selected ? '#b55f45' : '#1c6556',
        fillOpacity: 0.95,
      });
      marker.bindPopup(
        `<strong>${escapeHtml(placeName(place))}</strong><br />${escapeHtml(place.region)}<br />`
        + `<a href="${basePath}/place/${encodeURIComponent(place.slug)}">Открыть запись</a>`,
      );
      marker.on('click', () => onSelect(place.slug));
      clusterGroup.addLayer(marker);
    }
    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
    };
  }, [map, places, selectedSlug, onSelect]);
  return null;
}

function TripRouteLayer({ trip, places }: { trip?: Trip; places: Place[] }) {
  const positions = useMemo(() => {
    if (!trip) return [] as [number, number][];
    const points: [number, number][] = [];
    for (const day of trip.days) {
      for (const stop of [...day.stops].sort((a, b) => a.order - b.order)) {
        const place = places.find(item => item.slug === stop.placeSlug);
        if (place) points.push([place.latitude, place.longitude]);
      }
    }
    return points;
  }, [trip, places]);
  if (positions.length < 2) return null;
  return <Polyline positions={positions} pathOptions={{ color: '#b55f45', weight: 3, opacity: 0.85, dashArray: '8 10' }} />;
}

export function MapPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('trip') ?? '';
  const { isSignedIn } = useAuth();
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), ...(category ? { category } : {}), ...(region ? { region } : {}) }), [search, category, region]);
  const places = useListPlaces(params, { query: { queryKey: getListPlacesQueryKey(params) } });
  const allPlaces = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey(), staleTime: 45_000 } });
  const numericTripId = Number(tripId);
  const cloudTrip = useGetTrip(numericTripId, {
    query: {
      queryKey: getGetTripQueryKey(numericTripId),
      enabled: Boolean(isSignedIn && tripId && Number.isFinite(numericTripId)),
    },
  });
  const guestTrip = useMemo(() => {
    if (isSignedIn || !tripId) return undefined;
    return safeRead<Trip[]>('wayzen-local-trips', []).find(item => String(item.id) === tripId);
  }, [isSignedIn, tripId]);
  const activeTrip = isSignedIn ? cloudTrip.data : guestTrip;
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
          {!places.isLoading && !places.isError && <PlaceClusters places={places.data ?? []} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />}
          <TripRouteLayer trip={activeTrip} places={allPlaces.data ?? places.data ?? []} />
        </MapContainer>
        <div className="map-disclaimer" data-testid="text-map-caveat">Архивные координаты — только ориентир. Проверяйте доступ и условия самостоятельно; WayZen не сообщает точное время в пути.</div>
      </section>
    </div><Footer />
  </main>;
}
