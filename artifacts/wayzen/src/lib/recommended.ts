import { customFetch, type Place } from '@workspace/api-client-react';

export type RecommendedMode = 'personalized' | 'empty_prefs' | 'no_matches';

export type RecommendedPlace = Place & {
  matchScore: number;
  matchReasons: string[];
};

export type RecommendedResponse = {
  mode: RecommendedMode;
  interests: string[];
  places: RecommendedPlace[];
};

export async function fetchRecommendedPlaces(): Promise<RecommendedResponse> {
  return customFetch<RecommendedResponse>('/api/places/recommended', {
    method: 'GET',
  });
}
