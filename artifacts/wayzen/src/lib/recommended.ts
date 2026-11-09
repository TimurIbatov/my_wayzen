import {
  listRecommendedPlaces,
  type ListRecommendedPlaces200,
  type ListRecommendedPlaces200PlacesItem,
} from '@workspace/api-client-react';

export type RecommendedMode = ListRecommendedPlaces200['mode'];
export type RecommendedPlace = ListRecommendedPlaces200PlacesItem;
export type RecommendedResponse = ListRecommendedPlaces200;

/** Thin wrapper over the Orval-generated client (same customFetch path). */
export async function fetchRecommendedPlaces(): Promise<RecommendedResponse> {
  return listRecommendedPlaces();
}
