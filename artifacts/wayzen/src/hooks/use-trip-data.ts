import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { getListTripsQueryKey, useDeleteTrip, useListTrips } from '@workspace/api-client-react';
import type { Trip } from '@workspace/api-client-react';
import { safeRead, saveLocal } from '@/lib/storage';

export function useTripData() {
  const { isSignedIn } = useAuth();
  const client = useQueryClient();
  const query = useListTrips({ query: { queryKey: getListTripsQueryKey(), enabled: Boolean(isSignedIn), staleTime: 20_000 } });
  const [guestTrips, setGuestTrips] = useState<Trip[]>(() => safeRead('wayzen-local-trips', []));
  const remove = useDeleteTrip({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getListTripsQueryKey() }) } });
  const deleteTrip = (id: number) => isSignedIn ? remove.mutate({ id }) : setGuestTrips(current => { const next = current.filter(trip => trip.id !== id); saveLocal('wayzen-local-trips', next); return next; });
  return { trips: isSignedIn ? query.data ?? [] : guestTrips, isSignedIn, loading: Boolean(isSignedIn && query.isLoading), error: isSignedIn ? query.error : null, retry: () => void query.refetch(), deleteTrip, deleting: remove.isPending };
}
