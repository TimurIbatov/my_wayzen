import { Heart, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import type { Place } from '@workspace/api-client-react';
import { categoryNames } from '@/lib/constants';
import { placeName } from '@/lib/place';

function PlaceArtwork({ place, onFavorite, saved, index = 0 }: { place: Place; onFavorite?: () => void; saved?: boolean; index?: number }) {
  const image = place.imageUrls?.find(url => Boolean(url));
  return <div className="place-image">
    {image ? <img src={image} alt={placeName(place)} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <div className={`art-fallback art-${index % 5}`} aria-hidden="true" />}
    <span className="image-label">WAYZEN / {String(index + 1).padStart(2, '0')}</span>
    {onFavorite && <button className="icon-btn" type="button" onClick={onFavorite} aria-label={saved ? 'Remove from favorites' : 'Save place'} data-testid={`button-favorite-${place.slug}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>}
  </div>;
}

export function PlaceCard({ place, index, saved, onSave }: { place: Place; index: number; saved: boolean; onSave: () => void }) {
  return <article className="place-card" data-testid={`card-place-${place.slug}`}>
    <PlaceArtwork place={place} index={index} saved={saved} onFavorite={onSave} />
    <div className="card-body">
      <Link href={`/place/${place.slug}`} data-testid={`link-place-${place.slug}`}><h3>{placeName(place)}</h3></Link>
      <div className="card-meta"><span className="tag">{categoryNames[place.category] ?? place.category}</span><span>{place.region}</span></div>
      <div style={{ marginTop: 10 }}><span className="unverified"><ShieldAlert size={12} />Предварительно · не проверено</span></div>
    </div>
  </article>;
}
