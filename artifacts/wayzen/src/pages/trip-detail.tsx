import { useEffect, useState } from 'react';
import { ArrowLeft, CircleHelp } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetTripQueryKey, getListPlacesQueryKey, getListTripsQueryKey,
  useGetTrip, useListPlaces, useUpdateTrip,
} from '@workspace/api-client-react';
import type { Trip, TripUpdate } from '@workspace/api-client-react';
import { Link, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { ArchiveNotice } from '@/components/ArchiveNotice';
import { DayStops } from '@/components/DayStops';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { LoadError } from '@/components/LoadError';
import { safeRead, saveLocal } from '@/lib/storage';

export function TripDetail() {
  const [, params] = useRoute('/trips/:id');
  const id = Number(params?.id);
  const { isSignedIn } = useAuth();
  const client = useQueryClient();
  const cloudTrip = useGetTrip(id, { query: { queryKey: getGetTripQueryKey(id), enabled: Boolean(isSignedIn && Number.isFinite(id)) } });
  const [guestTrips, setGuestTrips] = useState<Trip[]>(() => safeRead('wayzen-local-trips', []));
  const trip = isSignedIn ? cloudTrip.data : guestTrips.find(item => item.id === id);
  const form = useForm<{ title: string; notes: string }>({ defaultValues: { title: '', notes: '' } });
  useEffect(() => { if (trip) form.reset({ title: trip.title, notes: trip.notes }); }, [trip?.id, trip?.updatedAt, form]);
  const update = useUpdateTrip({ mutation: { onSuccess: () => { void client.invalidateQueries({ queryKey: getGetTripQueryKey(id) }); void client.invalidateQueries({ queryKey: getListTripsQueryKey() }); } } });
  const places = useListPlaces(undefined, { query: { queryKey: getListPlacesQueryKey() } });
  const onSubmit = form.handleSubmit(value => {
    if (!trip) return;
    const patch: TripUpdate = { title: value.title.trim(), notes: value.notes };
    if (isSignedIn) update.mutate({ id, data: patch });
    else { const next = guestTrips.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item); setGuestTrips(next); saveLocal('wayzen-local-trips', next); }
  });
  if (isSignedIn && cloudTrip.isLoading) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 260 }} /></main>;
  if (isSignedIn && cloudTrip.isError) return <main className="wrap load-shell"><LoadError error={cloudTrip.error} onRetry={() => void cloudTrip.refetch()} /></main>;
  if (!trip) return <main className="wrap load-shell"><EmptyState icon={<CircleHelp />} title="Поездка не найдена" copy="Возможно, она удалена или сохранена в другом браузере." action={<Link className="btn btn-primary" href="/trips">К поездкам</Link>} /></main>;
  return <main className="wrap"><div className="intro"><Link className="btn btn-quiet" href="/trips"><ArrowLeft size={15} />К поездкам</Link><h1 className="display" style={{ marginTop: 20 }}>{trip.title}</h1></div>
    <div className="planner-layout"><section className="panel"><h2>Дни поездки</h2>{trip.days.map(day => <DayStops key={day.day} day={day} places={places.data ?? []} />)}<ArchiveNotice compact /></section>
      <aside className="panel"><h3>Заметки и название</h3><Form {...form}><form onSubmit={onSubmit} data-testid="form-edit-trip"><FormField control={form.control} name="title" render={({ field }) => <FormItem className="field-label"><FormLabel>Название</FormLabel><FormControl><input className="field" maxLength={120} {...field} data-testid="input-trip-title" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="notes" render={({ field }) => <FormItem className="field-label" style={{ marginTop: 12 }}><FormLabel>Заметки</FormLabel><FormControl><textarea className="textarea" maxLength={2000} {...field} data-testid="input-trip-notes" /></FormControl><FormMessage /></FormItem>} /><button className="btn btn-primary" style={{ marginTop: 14 }} type="submit" disabled={update.isPending} data-testid="button-update-trip">{update.isPending ? 'Сохраняем…' : 'Сохранить изменения'}</button></form></Form></aside>
    </div><Footer />
  </main>;
}
