import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListFavoritesQueryKey,
  useAddFavorite, useListFavorites, useRemoveFavorite,
} from '@workspace/api-client-react';
import { useLocalSet } from '@/lib/storage';

export function useFavoritesState() {
  const { isSignedIn } = useAuth();
  const guest = useLocalSet('wayzen-favorites');
  const client = useQueryClient();
  const cloud = useListFavorites({ query: { queryKey: getListFavoritesQueryKey(), enabled: Boolean(isSignedIn), staleTime: 20_000 } });
  const add = useAddFavorite({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getListFavoritesQueryKey() }) } });
  const remove = useRemoveFavorite({ mutation: { onSuccess: () => void client.invalidateQueries({ queryKey: getListFavoritesQueryKey() }) } });
  const values = isSignedIn ? cloud.data?.map(favorite => favorite.placeSlug) ?? [] : guest.values;
  const toggle = (slug: string) => {
    if (!isSignedIn) { guest.toggle(slug); return; }
    if (values.includes(slug)) remove.mutate({ slug }); else add.mutate({ data: { placeSlug: slug } });
  };
  return { values, toggle, loading: Boolean(isSignedIn && cloud.isLoading), error: isSignedIn ? cloud.error : null, retry: () => void cloud.refetch() };
}
