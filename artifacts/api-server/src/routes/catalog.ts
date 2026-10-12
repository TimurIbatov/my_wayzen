import { and, asc, eq, ilike, ne, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreatePlaceBody,
  CreatePlaceResponse,
  DeletePlaceParams,
  DeletePlaceResponse,
  GetOverviewResponse,
  GetPlaceParams,
  GetPlaceResponse,
  ListAdminPlacesResponse,
  ListPlacesQueryParams,
  ListPlacesResponse,
  UpdatePlaceBody,
  UpdatePlaceParams,
  UpdatePlaceResponse,
} from "@workspace/api-zod";
import { db, placesTable } from "@workspace/db";
import {
  requireAdminId,
  sendInvalidInput,
  sendServerError,
} from "./helpers";

const router: IRouter = Router();

function publicPlacesWhere(search?: string, category?: string, region?: string) {
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

router.get("/places", async (req, res) => {
  const parsed = ListPlacesQueryParams.safeParse(req.query);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const places = await db
      .select()
      .from(placesTable)
      .where(
        publicPlacesWhere(
          parsed.data.search,
          parsed.data.category,
          parsed.data.region,
        ),
      )
      .orderBy(asc(placesTable.nameEn));
    return res.json(ListPlacesResponse.parse(places));
  } catch {
    return sendServerError(res);
  }
});

router.get("/places/:slug", async (req, res) => {
  const parsed = GetPlaceParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [place] = await db
      .select()
      .from(placesTable)
      .where(
        and(
          eq(placesTable.slug, parsed.data.slug),
          ne(placesTable.verificationStatus, "draft"),
        ),
      )
      .limit(1);
    if (!place) return res.status(404).json({ error: "Place not found." });
    return res.json(GetPlaceResponse.parse(place));
  } catch {
    return sendServerError(res);
  }
});

router.get("/overview", async (_req, res) => {
  try {
    const places = await db
      .select()
      .from(placesTable)
      .where(ne(placesTable.verificationStatus, "draft"))
      .orderBy(asc(placesTable.nameEn));
    const categories = [...new Set(places.map((place) => place.category))].sort();
    const regions = [...new Set(places.map((place) => place.region))].sort();
    const data = {
      placesTotal: places.length,
      preliminaryCount: places.filter(
        (place) => place.verificationStatus === "preliminary",
      ).length,
      categories,
      regions,
      featuredPlaces: places.slice(0, 4),
    };
    return res.json(GetOverviewResponse.parse(data));
  } catch {
    return sendServerError(res);
  }
});

router.get("/admin/places", async (req, res) => {
  if (!requireAdminId(req, res)) return;
  try {
    const places = await db
      .select()
      .from(placesTable)
      .orderBy(asc(placesTable.updatedAt));
    return res.json(ListAdminPlacesResponse.parse(places));
  } catch {
    return sendServerError(res);
  }
});

router.post("/admin/places", async (req, res) => {
  if (!requireAdminId(req, res)) return;
  const parsed = CreatePlaceBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [place] = await db
      .insert(placesTable)
      .values(parsed.data)
      .returning();
    return res.status(201).json(CreatePlaceResponse.parse(place));
  } catch {
    return sendServerError(res);
  }
});

router.patch("/admin/places/:slug", async (req, res) => {
  if (!requireAdminId(req, res)) return;
  const params = UpdatePlaceParams.safeParse(req.params);
  const changes = UpdatePlaceBody.safeParse(req.body);
  if (!params.success || !changes.success) return sendInvalidInput(res);
  if (Object.keys(changes.data).length === 0) return sendInvalidInput(res);
  try {
    const [place] = await db
      .update(placesTable)
      .set(changes.data)
      .where(eq(placesTable.slug, params.data.slug))
      .returning();
    if (!place) return res.status(404).json({ error: "Place not found." });
    return res.json(UpdatePlaceResponse.parse(place));
  } catch {
    return sendServerError(res);
  }
});

router.delete("/admin/places/:slug", async (req, res) => {
  if (!requireAdminId(req, res)) return;
  const parsed = DeletePlaceParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [deleted] = await db
      .delete(placesTable)
      .where(eq(placesTable.slug, parsed.data.slug))
      .returning({ slug: placesTable.slug });
    if (!deleted) return res.status(404).json({ error: "Place not found." });
    return res.status(204).send(DeletePlaceResponse.parse(undefined));
  } catch {
    return sendServerError(res);
  }
});

export default router;
