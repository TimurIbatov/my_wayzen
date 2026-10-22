import { and, asc, eq, ilike, ne, or, type SQL } from "drizzle-orm";
import { db, placesTable } from "@workspace/db";

export function publicPlacesWhere(
  search?: string,
  category?: string,
  region?: string,
): SQL | undefined {
  const conditions = [ne(placesTable.verificationStatus, "draft")];
  if (category) conditions.push(eq(placesTable.category, category));
  if (region) conditions.push(eq(placesTable.region, region));
  if (search?.trim()) {
    const term = `%${search.trim().slice(0, 120)}%`;
    conditions.push(
      or(
        ilike(placesTable.nameRu, term),
        ilike(placesTable.nameEn, term),
        ilike(placesTable.region, term),
        ilike(placesTable.kind, term),
      )!,
    );
  }
  return and(...conditions);
}

export async function listPublicPlaces(opts: {
  search?: string;
  category?: string;
  region?: string;
}) {
  return db
    .select()
    .from(placesTable)
    .where(publicPlacesWhere(opts.search, opts.category, opts.region))
    .orderBy(asc(placesTable.nameEn));
}

export async function getPublicPlaceBySlug(slug: string) {
  const [place] = await db
    .select()
    .from(placesTable)
    .where(and(eq(placesTable.slug, slug), ne(placesTable.verificationStatus, "draft")))
    .limit(1);
  return place ?? null;
}

export async function getOverview() {
  const places = await db
    .select()
    .from(placesTable)
    .where(ne(placesTable.verificationStatus, "draft"))
    .orderBy(asc(placesTable.nameEn));
  const categories = [...new Set(places.map((place) => place.category))].sort();
  const regions = [...new Set(places.map((place) => place.region))].sort();
  return {
    placesTotal: places.length,
    preliminaryCount: places.filter(
      (place) => place.verificationStatus === "preliminary",
    ).length,
    categories,
    regions,
    featuredPlaces: places.slice(0, 4),
  };
}
