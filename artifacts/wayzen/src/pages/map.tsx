import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ExternalLink, MapPin, Route, Search, X } from 'lucide-react';
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
import { Link, useLocation, useSearchParams } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { useTripData } from '@/hooks/use-trip-data';
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
      const directions = `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=12/${place.latitude}/${place.longitude}`;
      marker.bindPopup(
        `<strong>${escapeHtml(placeName(place))}</strong><br />${escapeHtml(place.region)}<br />`
        + `<a href="${basePath}/place/${encodeURIComponent(place.slug)}">Открыть запись</a>`
        + ` · <a href="${directions}" target="_blank" rel="noreferrer">Открыть в OSM</a>`,
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
      const ordered = [...day.stops].sort((a, b) => a.order - b.order);
      for (const stop of ordered) {
        const place = places.find(item => item.slug === stop.placeSlug);
        if (place) points.push([place.latitude, place.longitude]);
      }
    }
    return points;
  }, [trip, places]);

  if (positions.length < 2) return null;
  return <Polyline
    positions={positions}
    pathOptions={{ color: '#b55f45', weight: 3, opacity: 0.85, dashArray: '8 10' }}
  />;
}

export function MapPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('trip') ?? '';
  const { isSignedIn } = useAuth();
  const tripList = useTripData();

  const allPlaces = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey(), staleTime: 45_000 } });
  const params = useMemo(() => ({
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(category ? { category } : {}),
    ...(region ? { region } : {}),
  }), [search, category, region]);
  const places = useListPlaces(params, { query: { queryKey: getListPlacesQueryKey(params) } });

  const categories = useMemo(
    () => Array.from(new Set(allPlaces.data?.map(place => place.category) ?? [])).sort(),
    [allPlaces.data],
  );
  const regions = useMemo(
    () => Array.from(new Set(allPlaces.data?.map(place => place.region) ?? [])).sort(),
    [allPlaces.data],
  );

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
  const routePlaces = allPlaces.data ?? places.data ?? [];
  const markerPlaces = places.data ?? [];
  const selected = markerPlaces.find(place => place.slug === selectedSlug);

  useEffect(() => {
    if (selectedSlug && places.data && !places.data.some(place => place.slug === selectedSlug)) {
      setSelectedSlug('');
    }
  }, [places.data, selectedSlug]);

  const updateTripFilter = (nextId: string) => {
    setLocation(nextId ? `/map?trip=${encodeURIComponent(nextId)}` : '/map');
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setRegion('');
  };

  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Географический ориентир</span><h1 className="display">Найти место на карте.</h1><p>Реальная интерактивная карта с архивными координатами. Точки помогают увидеть расположение, но не показывают маршрут, доступ или условия посещения.</p></div>
    <ArchiveNotice compact />
    <div className="map-page" style={{ marginTop: 18 }}>
      <aside className="map-panel">
        <div className="search-field"><Search size={16} /><input className="field" value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти в архиве" aria-label="Поиск на карте" data-testid="input-map-search" /></div>
        <select className="select" value={category} onChange={event => setCategory(event.target.value)} aria-label="Фильтр по категории" data-testid="select-map-category">
          <option value="">Все категории</option>
          {categories.map(option => <option key={option} value={option}>{categoryNames[option] ?? option}</option>)}
        </select>
        <select className="select" value={region} onChange={event => setRegion(event.target.value)} aria-label="Фильтр по области" data-testid="select-map-region">
          <option value="">Все области</option>
          {regions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <select
          className="select"
          value={tripId}
          onChange={event => updateTripFilter(event.target.value)}
          aria-label="Показать порядок поездки"
          data-testid="select-map-trip"
        >
          <option value="">Без линии поездки</option>
          {tripList.trips.map(trip => <option key={trip.id} value={String(trip.id)}>{trip.title}</option>)}
        </select>
        {(search || category || region) && (
          <button className="btn btn-quiet" type="button" onClick={clearFilters} data-testid="button-clear-map-filters">
            <X size={15} /> Сбросить фильтры
          </button>
        )}
        {tripId && activeTrip && (
          <p className="unverified" data-testid="text-map-trip-note" style={{ margin: 0 }}>
            <Route size={13} /> Линия показывает порядок остановок «{activeTrip.title}» — ориентир, не навигация.
            {' '}<a href="https://www.openstreetmap.org/directions" target="_blank" rel="noreferrer">Внешние направления <ExternalLink size={12} /></a>
          </p>
        )}
        {tripId && isSignedIn && cloudTrip.isError && <LoadError error={cloudTrip.error} onRetry={() => void cloudTrip.refetch()} />}
        <div className="map-results" data-testid="map-place-list">
          {places.isLoading ? <div className="skeleton" style={{ height: 110 }} /> : places.isError ? <LoadError error={places.error} onRetry={() => void places.refetch()} /> :
            markerPlaces.length ? markerPlaces.map(place => <button className={`map-row ${selectedSlug === place.slug ? 'selected' : ''}`} key={place.slug} onClick={() => setSelectedSlug(place.slug)} data-testid={`map-list-${place.slug}`}><i className="map-dot" /><span className="map-row-copy"><strong>{placeName(place)}</strong><span>{place.region} · {categoryNames[place.category] ?? place.category}</span></span><ChevronRight size={15} /></button>) :
              <EmptyState icon={<MapPin size={20} />} title="Нет точек" copy="Измените поиск или фильтры." />}
        </div>
        {!tripList.trips.length && <p style={{ fontSize: 11, color: '#718077', margin: 0 }}>Сохраните поездку в <Link href="/planner">планере</Link>, чтобы нарисовать порядок остановок.</p>}
      </aside>
      <section className="map-canvas" aria-label="Карта Узбекистана и мест архива" data-testid="interactive-map">
        <MapContainer center={[41.1, 64.4]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', minHeight: 600, width: '100%', zIndex: 1 }} attributionControl>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFocus place={selected} />
          {!places.isLoading && !places.isError && <PlaceClusters places={markerPlaces} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />}
          <TripRouteLayer trip={activeTrip} places={routePlaces} />
        </MapContainer>
        <div className="map-disclaimer" data-testid="text-map-caveat">Архивные координаты — только ориентир. Проверяйте доступ и условия самостоятельно; WayZen не сообщает точное время в пути. Кластеры объединяют близкие точки; линия поездки не является маршрутом.</div>
      </section>
    </div><Footer />
  </main>;
}
