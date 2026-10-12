import { ArrowRight, Bookmark, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { useTripData } from '@/hooks/use-trip-data';

export function Trips() {
  const data = useTripData();
  return <main className="wrap">
    <div className="intro"><span className="eyebrow">Сохранённые планы</span><h1 className="display">Поездки, которые ждут.</h1><p>{data.isSignedIn ? 'Поездки синхронизируются с вашим аккаунтом.' : 'Гостевые поездки хранятся локально в браузере. Войдите, чтобы использовать облачное хранилище.'}</p></div>
    <ArchiveNotice compact />
    {data.loading ? <div className="load-shell"><div className="skeleton" style={{ height: 88, marginBottom: 10 }} /><div className="skeleton" style={{ height: 88 }} /></div> : data.error ? <div style={{ marginTop: 18 }}><LoadError error={data.error} onRetry={data.retry} /></div> :
      data.trips.length ? <section className="section">{data.trips.map((trip, index) => <div className="trip-row" key={trip.id} data-testid={`trip-row-${trip.id}`}><span className="trip-index">{String(index + 1).padStart(2, '0')}</span><Link className="trip-copy" href={`/trips/${trip.id}`} data-testid={`link-trip-${trip.id}`}><strong>{trip.title}</strong><span>{trip.days.length} дней · {trip.days.reduce((count, day) => count + day.stops.length, 0)} остановок</span></Link><Link className="btn btn-quiet" href={`/trips/${trip.id}`} data-testid={`button-open-trip-${trip.id}`}>Открыть</Link><button className="icon-btn" aria-label="Удалить поездку" onClick={() => { if (window.confirm('Удалить эту поездку?')) data.deleteTrip(trip.id); }} data-testid={`button-delete-trip-${trip.id}`}><Trash2 size={16} /></button></div>)}</section> :
        <div style={{ marginTop: 20 }}><EmptyState icon={<Bookmark size={21} />} title="Список пока пуст" copy="Сохраните маршрут из планера — он появится здесь." action={<Link className="btn btn-primary" href="/planner" data-testid="link-start-planning">Открыть планер <ArrowRight size={15} /></Link>} /></div>}
    {!data.isSignedIn && <div style={{ marginTop: 16 }}><Link className="btn btn-quiet" href="/sign-in" data-testid="link-sync-trips">Войти для облачной синхронизации</Link></div>}
    <Footer />
  </main>;
}
