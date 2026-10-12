import { useQueryClient } from '@tanstack/react-query';
import { getListTripsQueryKey, useCreateTrip } from '@workspace/api-client-react';
import type { Trip, TripInput } from '@workspace/api-client-react';

type TripCreateOptions = {
  onSuccess?: (trip: Trip) => void;
  onError?: (error: Error) => void;
};

export function useTripCreate(options: TripCreateOptions = {}) {
  const client = useQueryClient();
  const mutation = useCreateTrip({
    mutation: {
      onSuccess: (trip) => {
        void client.invalidateQueries({ queryKey: getListTripsQueryKey() });
        options.onSuccess?.(trip);
      },
      onError: (error) => {
        options.onError?.(error instanceof Error ? error : new Error('Не удалось сохранить поездку.'));
      },
    },
  });
  return {
    mutate: (data: TripInput) => mutation.mutate({ data }),
    mutateAsync: (data: TripInput) => mutation.mutateAsync({ data }),
    loading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
