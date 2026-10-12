import { and, asc, eq, ne } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ActivateDemoTripPassResponse,
  AddFavoriteBody,
  AddFavoriteResponse,
  CreateTripBody,
  CreateTripPassCheckoutResponse,
  CreateTripResponse,
  DeleteTripParams,
  DeleteTripResponse,
  GetProfileResponse,
  GetTripParams,
  GetTripResponse,
  ListFavoritesResponse,
  ListTripsResponse,
  RemoveFavoriteParams,
  RemoveFavoriteResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  UpdateTripBody,
  UpdateTripParams,
  UpdateTripResponse,
} from "@workspace/api-zod";
import {
  aiUsageTable,
  db,
  favoritesTable,
  placesTable,
  travelerProfilesTable,
  tripsTable,
} from "@workspace/db";
import { getStripe } from "../lib/stripe";
import {
  computeTripPassExpiry,
  effectiveTravelPlan,
  offlineMapsFeatureEnabled,
  stripeConfigured,
} from "../lib/tripPass";
import { getOrCreateTravelerProfile } from "../lib/travelerProfiles";
import {
  isWayZenAdmin,
  requireUserId,
  sendInvalidInput,
  sendServerError,
} from "./helpers";

const router: IRouter = Router();
export const FREE_ROUTE_DAILY_LIMIT = 1;
export const FREE_CHAT_DAILY_LIMIT = 10;

export function getSamarkandDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Samarkand",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getRouteUsage(actorId: string): Promise<number> {
  const [usage] = await db
    .select({ routesUsed: aiUsageTable.routesUsed })
    .from(aiUsageTable)
    .where(
      and(
        eq(aiUsageTable.actorId, actorId),
        eq(aiUsageTable.usageDate, getSamarkandDate()),
      ),
    )
    .limit(1);
  return usage?.routesUsed ?? 0;
}

export async function getChatUsage(actorId: string): Promise<number> {
  const [usage] = await db
    .select({ chatUsed: aiUsageTable.chatUsed })
    .from(aiUsageTable)
    .where(
      and(
        eq(aiUsageTable.actorId, actorId),
        eq(aiUsageTable.usageDate, getSamarkandDate()),
      ),
    )
    .limit(1);
  return usage?.chatUsed ?? 0;
}

async function buildProfileResponse(userId: string) {
  const profile = await getOrCreateTravelerProfile(userId);
  const plan = effectiveTravelPlan(profile);
  const [aiRoutesUsedToday, aiChatUsedToday] = await Promise.all([
    getRouteUsage(userId),
    getChatUsage(userId),
  ]);
  return GetProfileResponse.parse({
    interests: profile.interests,
    pace: profile.pace,
    budget: profile.budget,
    travelStyle: profile.travelStyle,
    plan,
    tripPassExpiresAt:
      plan === "trip_pass" ? (profile.tripPassExpiresAt?.toISOString() ?? null) : null,
    aiRoutesUsedToday,
    aiRoutesLimit: plan === "trip_pass" ? -1 : FREE_ROUTE_DAILY_LIMIT,
    aiChatUsedToday,
    aiChatLimit: plan === "trip_pass" ? -1 : FREE_CHAT_DAILY_LIMIT,
    isAdmin: isWayZenAdmin(userId),
    offlineMapsEnabled: offlineMapsFeatureEnabled(),
  });
}

router.get("/me/profile", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    return res.json(await buildProfileResponse(userId));
  } catch {
    return sendServerError(res);
  }
});

router.put("/me/profile", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    await db
      .insert(travelerProfilesTable)
      .values({ userId, ...parsed.data })
      .onConflictDoUpdate({
        target: travelerProfilesTable.userId,
        set: parsed.data,
      });
    return res.json(await buildProfileResponse(userId));
  } catch {
    return sendServerError(res);
  }
});

router.get("/me/favorites", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const favorites = await db
      .select({
        placeSlug: favoritesTable.placeSlug,
        createdAt: favoritesTable.createdAt,
      })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId))
      .orderBy(asc(favoritesTable.createdAt));
    return res.json(ListFavoritesResponse.parse(favorites));
  } catch {
    return sendServerError(res);
  }
});

router.post("/me/favorites", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [place] = await db
      .select({ slug: placesTable.slug })
      .from(placesTable)
      .where(
        and(
          eq(placesTable.slug, parsed.data.placeSlug),
          ne(placesTable.verificationStatus, "draft"),
        ),
      )
      .limit(1);
    if (!place) return res.status(404).json({ error: "Place not found." });
    await db
      .insert(favoritesTable)
      .values({ userId, placeSlug: parsed.data.placeSlug })
      .onConflictDoNothing();
    const [favorite] = await db
      .select({
        placeSlug: favoritesTable.placeSlug,
        createdAt: favoritesTable.createdAt,
      })
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.placeSlug, parsed.data.placeSlug),
        ),
      )
      .limit(1);
    return res.status(201).json(AddFavoriteResponse.parse(favorite));
  } catch {
    return sendServerError(res);
  }
});

router.delete("/me/favorites/:slug", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = RemoveFavoriteParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.placeSlug, parsed.data.slug),
        ),
      );
    return res.status(204).send(RemoveFavoriteResponse.parse(undefined));
  } catch {
    return sendServerError(res);
  }
});

router.get("/me/trips", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const trips = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, userId))
      .orderBy(asc(tripsTable.createdAt));
    return res.json(ListTripsResponse.parse(trips));
  } catch {
    return sendServerError(res);
  }
});

router.post("/me/trips", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [trip] = await db
      .insert(tripsTable)
      .values({ userId, ...parsed.data })
      .returning();
    return res.status(201).json(CreateTripResponse.parse(trip));
  } catch {
    return sendServerError(res);
  }
});

router.get("/me/trips/:id", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = GetTripParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(
        and(eq(tripsTable.userId, userId), eq(tripsTable.id, parsed.data.id)),
      )
      .limit(1);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    return res.json(GetTripResponse.parse(trip));
  } catch {
    return sendServerError(res);
  }
});

router.patch("/me/trips/:id", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = UpdateTripParams.safeParse(req.params);
  const changes = UpdateTripBody.safeParse(req.body);
  if (!params.success || !changes.success) return sendInvalidInput(res);
  if (Object.keys(changes.data).length === 0) return sendInvalidInput(res);
  try {
    const [trip] = await db
      .update(tripsTable)
      .set(changes.data)
      .where(
        and(eq(tripsTable.userId, userId), eq(tripsTable.id, params.data.id)),
      )
      .returning();
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    return res.json(UpdateTripResponse.parse(trip));
  } catch {
    return sendServerError(res);
  }
});

router.delete("/me/trips/:id", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = DeleteTripParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [trip] = await db
      .delete(tripsTable)
      .where(
        and(eq(tripsTable.userId, userId), eq(tripsTable.id, parsed.data.id)),
      )
      .returning({ id: tripsTable.id });
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    return res.status(204).send(DeleteTripResponse.parse(undefined));
  } catch {
    return sendServerError(res);
  }
});

router.post("/me/trip-pass/demo", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found." });
  }
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const expiresAt = computeTripPassExpiry();
    await db
      .insert(travelerProfilesTable)
      .values({ userId, plan: "trip_pass", tripPassExpiresAt: expiresAt })
      .onConflictDoUpdate({
        target: travelerProfilesTable.userId,
        set: { plan: "trip_pass", tripPassExpiresAt: expiresAt },
      });
    return res.json(ActivateDemoTripPassResponse.parse(await buildProfileResponse(userId)));
  } catch {
    return sendServerError(res);
  }
});

router.post("/me/trip-pass/checkout", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!stripeConfigured()) {
    return res.status(503).json({
      error: "Trip Pass checkout is not configured. Set STRIPE_SECRET_KEY and STRIPE_TRIP_PASS_PRICE_ID.",
    });
  }
  const stripe = getStripe();
  const priceId = process.env.STRIPE_TRIP_PASS_PRICE_ID?.trim();
  if (!stripe || !priceId) {
    return res.status(503).json({ error: "Trip Pass checkout is not configured." });
  }
  try {
    const origin =
      (typeof req.headers.origin === "string" && req.headers.origin) ||
      process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:5173";
    const successUrl =
      process.env.STRIPE_SUCCESS_URL?.trim() ||
      `${origin}/profile?trip_pass=success`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL?.trim() ||
      `${origin}/profile?trip_pass=cancelled`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        product: "trip_pass",
      },
    });
    if (!session.url) {
      return res.status(503).json({ error: "Stripe did not return a checkout URL." });
    }
    return res.json(CreateTripPassCheckoutResponse.parse({ url: session.url }));
  } catch (error) {
    console.error("Trip Pass checkout failed.", error);
    return sendServerError(res);
  }
});

export default router;
