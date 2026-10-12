import type { Place, TripDay } from '@workspace/api-client-react';
import { placeName } from '@/lib/place';

export function DayStops({ day, places }: { day: TripDay; places: Place[] }) {
  return <article className="day-card"><h3>День {day.day} · {day.theme}</h3>{day.stops.map(stop => {
    const place = places.find(item => item.slug === stop.placeSlug);
    return <div className="stop-line" key={`${day.day}-${stop.order}-${stop.placeSlug}`}><span className="stop-order">{stop.order}</span><span><strong>{place ? placeName(place) : stop.placeSlug}</strong><small>Оценка пути {stop.estimatedTravelMinutes} мин · рекомендуемое посещение {stop.suggestedVisitMinutes} мин. Не проверено.</small>{stop.note && <small> · {stop.note}</small>}</span></div>;
  })}</article>;
}
