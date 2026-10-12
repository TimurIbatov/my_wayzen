import { useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Heart, MapPin, Plus, ShieldAlert } from 'lucide-react';
import { getGetPlaceQueryKey, useGetPlace } from '@workspace/api-client-react';
import { Link, useLocation, useRoute } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { useFavoritesState } from '@/hooks/use-favorites';
import { categoryNames } from '@/lib/constants';
import { placeName } from '@/lib/place';
import { safeRead, saveLocal } from '@/lib/storage';

export function PlaceDetail() {
  const [, params] = useRoute('/place/:slug');
  const [, setLocation] = useLocation();
  const place = useGetPlace(params?.slug ?? '', { query: { queryKey: getGetPlaceQueryKey(params?.slug ?? ''), enabled: Boolean(params?.slug) } });
  const favorites = useFavoritesState();
  const [message, setMessage] = useState('');
  if (place.isLoading) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 280, borderRadius: 22 }} /><div className="skeleton" style={{ height: 170, marginTop: 18, borderRadius: 18 }} /></main>;
  if (place.isError) return <main className="wrap load-shell"><LoadError error={place.error} onRetry={() => void place.refetch()} /></main>;
  if (!place.data) return <main className="wrap load-shell"><EmptyState icon={<MapPin />} title="Место не найдено" copy="Этой записи нет в доступном архиве." action={<Link className="btn btn-primary" href="/places">К каталогу</Link>} /></main>;
  const item = place.data;
  const category = categoryNames[item.category] ?? item.category;
  return <main className="wrap">
    <div className="intro" style={{ paddingBottom: 16 }}><Link className="btn btn-quiet" href="/places" data-testid="link-back-catalog"><ArrowLeft size={15} />К каталогу</Link></div>
    <section className="detail-hero"><div><span className="eyebrow" style={{ color: '#f0cf9c' }}>{category} · {item.region}</span><h1>{placeName(item)}</h1></div></section>
    <div className="detail-layout">
      <section className="detail-copy">
        <span className="unverified"><ShieldAlert size={13} />Предварительная запись · не проверено</span>
        {item.imageUrls.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, margin: '18px 0' }} data-testid="place-photo-gallery">
          {item.imageUrls.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${placeName(item)} · фото ${index + 1}`} loading="lazy" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14, background: '#e6e9e2' }} onError={event => { event.currentTarget.style.display = 'none'; }} />)}
        </div> : <div className="art-fallback art-0" role="img" aria-label="Фотография пока не добавлена" style={{ minHeight: 180, borderRadius: 14, margin: '18px 0', display: 'grid', placeItems: 'center', color: '#48634f' }}>Фотография пока не добавлена</div>}
        <h2>{item.kind}</h2>
        <p>{item.summaryRu || item.summaryEn || 'Для этой записи пока нет краткого описания.'}</p>
        <p>{item.storyRu || item.storyEn || 'Дополнительный архивный рассказ для этой записи пока не добавлен.'}</p>
        <ArchiveNotice />
        <h2>Практические заметки</h2><p>{item.practicalNotesRu || item.practicalNotesEn || 'Архив не содержит подтверждённых практических сведений для этой точки.'}</p>
        <p>Координаты и материалы взяты из архивной записи. Мы не подтверждаем текущий доступ, безопасность, правила посещения, сезонность, часы работы, стоимость или время в пути. Проверьте всё отдельно перед поездкой.</p>
        <h2>Источники записи и фото</h2><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.source || 'Для этой записи пока не указан источник.'}</p>
        {message && <p role="status" data-testid="status-place-added">{message}</p>}
      </section>
      <aside className="detail-side">
        <span className="eyebrow">Архивные координаты</span><span className="coords">{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</span>
        <a className="btn btn-primary" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=10/${item.latitude}/${item.longitude}`} target="_blank" rel="noreferrer" data-testid="link-open-osm">Посмотреть район <ExternalLink size={15} /></a>
        <button className="btn btn-quiet" onClick={() => favorites.toggle(item.slug)} data-testid="button-detail-favorite">{favorites.values.includes(item.slug) ? <Check size={15} /> : <Heart size={15} />}{favorites.values.includes(item.slug) ? 'В избранном' : 'Сохранить место'}</button>
        <button className="btn btn-quiet" onClick={() => { const stops = safeRead<string[]>('wayzen-planner-stops', []); if (!stops.includes(item.slug)) saveLocal('wayzen-planner-stops', [...stops, item.slug]); setMessage('Добавлено в список планера на этом устройстве.'); setLocation('/planner'); }} data-testid="button-add-to-planner"><Plus size={15} />Добавить в планер</button>
      </aside>
    </div><Footer />
  </main>;
}
