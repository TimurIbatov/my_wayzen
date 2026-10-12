import { useQueryClient } from '@tanstack/react-query';
import { getListTripsQueryKey, useCreateTrip } from '@workspace/api-client-react';
import type { TripInput } from '@workspace/api-client-react';

export function useTripCreate() {
  const client = useQueryClient();
  const mutation = useCreateTrip({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getListTripsQueryKey() }) } });
  return { mutate: (data: TripInput) => mutation.mutate({ data }), loading: mutation.isPending, error: mutation.error };
}
