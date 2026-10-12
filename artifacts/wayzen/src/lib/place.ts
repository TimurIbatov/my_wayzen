import type { Place } from '@workspace/api-client-react';

export const placeName = (place: Place) => place.nameRu || place.nameEn || place.slug;
