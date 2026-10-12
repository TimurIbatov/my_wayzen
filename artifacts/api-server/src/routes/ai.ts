import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import {
  ChatWithWayZenBody,
  CreateGeminiConversationBody,
  CreateGeminiConversationResponse,
  DeleteGeminiConversationParams,
  DeleteGeminiConversationResponse,
  GenerateAiRouteBody,
  GenerateAiRouteResponse,
  GetGeminiConversationParams,
  GetGeminiConversationResponse,
  ListGeminiConversationsResponse,
  SendGeminiMessageBody,
  SendGeminiMessageParams,
} from "@workspace/api-zod";
import {
  aiUsageTable,
  chatMessagesTable,
  conversationsTable,
  db,
  placesTable,
  type Place,
  type TripDayData,
  type TripStopData,
} from "@workspace/db";
import { Router, type Request, type Response as ExpressResponse } from "express";
import { hasActiveTripPass } from "../lib/tripPass";
import { getOrCreateTravelerProfile } from "../lib/travelerProfiles";
import {
  buildWayZenSystemInstruction,
  generateGeminiJson,
  openGeminiStream,
  relayGeminiStream,
} from "../lib/wayzenAi";
import {
  getChatUsage,
  getRouteUsage,
  getSamarkandDate,
  FREE_CHAT_DAILY_LIMIT,
  FREE_ROUTE_DAILY_LIMIT,
} from "./travelers";
import { getUserId, requireUserId, sendInvalidInput, sendServerError } from "./helpers";

const router: Router = Router();
const burstWindows = new Map<string, { count: number; resetsAt: number }>();
const GUEST_COOKIE = "wayzen_guest";
const GUEST_COOKIE_AGE_MS = 365 * 24 * 60 * 60 * 1000;

type UsageCounter = "routesUsed" | "chatUsed";
type ChatLine = { role: "user" | "assistant"; content: string };
type RouteDraft = {
  title: string;
  days: { day: number; theme: string; stops: { placeSlug: string; note?: string }[] }[];
};

function allowBurst(req: Request, res: ExpressResponse, scope: string, max: number): boolean {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `${scope}:${ip}`;
  const current = burstWindows.get(key);
  if (!current || current.resetsAt <= now) {
    burstWindows.set(key, { count: 1, resetsAt: now + 60_000 });
    if (burstWindows.size > 2_000) {
      for (const [candidate, window] of burstWindows) {
        if (window.resetsAt <= now) burstWindows.delete(candidate);
      }
    }
    return true;
  }
  if (current.count >= max) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((current.resetsAt - now) / 1000))));
    res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
    return false;
  }
  current.count += 1;
  return true;
}

function signGuestId(id: string, secret: string): string {
  return createHmac("sha256", secret).update(id).digest("hex");
}

function guestActorId(req: Request, res: ExpressResponse): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Guest session signing is not configured.");
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_COOKIE}=`))
    ?.slice(GUEST_COOKIE.length + 1);
  if (cookie) {
    const [id, signature] = decodeURIComponent(cookie).split(".");
    if (
      id &&
      /^[0-9a-f-]{36}$/i.test(id) &&
      signature &&
      /^[0-9a-f]{64}$/i.test(signature)
    ) {
      const expected = Buffer.from(signGuestId(id, secret), "hex");
      const provided = Buffer.from(signature, "hex");
      if (expected.length === provided.length && timingSafeEqual(expected, provided)) {
        return `guest:${id}`;
      }
    }
  }
  const id = randomUUID();
  const signature = signGuestId(id, secret);
  res.cookie(GUEST_COOKIE, `${id}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    maxAge: GUEST_COOKIE_AGE_MS,
    path: "/api",
  });
  return `guest:${id}`;
}

async function getCounter(actorId: string, counter: UsageCounter): Promise<number> {
  return counter === "routesUsed"
    ? getRouteUsage(actorId)
    : getChatUsage(actorId);
}

async function reserveQuota(
  actorId: string,
  counter: UsageCounter,
  limit: number,
): Promise<number | null> {
  const usageDate = getSamarkandDate();
  if (counter === "routesUsed") {
    const [row] = await db
      .insert(aiUsageTable)
      .values({ actorId, usageDate, routesUsed: 1 })
      .onConflictDoUpdate({
        target: [aiUsageTable.actorId, aiUsageTable.usageDate],
        set: { routesUsed: sql`${aiUsageTable.routesUsed} + 1` },
        setWhere: sql`${aiUsageTable.routesUsed} < ${limit}`,
      })
      .returning({ used: aiUsageTable.routesUsed });
    return row?.used ?? null;
  }
  const [row] = await db
    .insert(aiUsageTable)
    .values({ actorId, usageDate, chatUsed: 1 })
    .onConflictDoUpdate({
      target: [aiUsageTable.actorId, aiUsageTable.usageDate],
      set: { chatUsed: sql`${aiUsageTable.chatUsed} + 1` },
      setWhere: sql`${aiUsageTable.chatUsed} < ${limit}`,
    })
    .returning({ used: aiUsageTable.chatUsed });
  return row?.used ?? null;
}

async function releaseQuota(actorId: string, counter: UsageCounter): Promise<void> {
  const usageDate = getSamarkandDate();
  const where = and(
    eq(aiUsageTable.actorId, actorId),
    eq(aiUsageTable.usageDate, usageDate),
  );
  if (counter === "routesUsed") {
    await db
      .update(aiUsageTable)
      .set({ routesUsed: sql`GREATEST(${aiUsageTable.routesUsed} - 1, 0)` })
      .where(where);
  } else {
    await db
      .update(aiUsageTable)
      .set({ chatUsed: sql`GREATEST(${aiUsageTable.chatUsed} - 1, 0)` })
      .where(where);
  }
}

async function loadCatalog(): Promise<Place[]> {
  return db
    .select()
    .from(placesTable)
    .where(ne(placesTable.verificationStatus, "draft"))
    .orderBy(asc(placesTable.nameEn));
}

function sendSse(res: ExpressResponse, value: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(value)}\n\n`);
}

function safeAiError(res: ExpressResponse, headersSent: boolean): void {
  const message = "WayZen AI is temporarily unavailable. Please try again.";
  if (!headersSent) {
    res.status(502).json({ error: message });
    return;
  }
  sendSse(res, { error: message });
  res.end();
}

async function runChatStream({
  req,
  res,
  actorId,
  userId,
  profile,
  messages,
  conversationId,
}: {
  req: Request;
  res: ExpressResponse;
  actorId: string;
  userId: string | null;
  profile?: Awaited<ReturnType<typeof getOrCreateTravelerProfile>>;
  messages: ChatLine[];
  conversationId?: number;
}): Promise<void> {
  const unlimited = hasActiveTripPass(profile);
  let reserved = false;
  let userMessageId: number | undefined;
  let provider: globalThis.Response | undefined;
  try {
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: "WayZen AI is not configured yet." });
      return;
    }
    if (!allowBurst(req, res, "chat", 12)) return;
    if (!unlimited) {
      const used = await reserveQuota(actorId, "chatUsed", FREE_CHAT_DAILY_LIMIT);
      if (used === null) {
        res.status(429).json({
          error: `The free chat limit of ${FREE_CHAT_DAILY_LIMIT} messages per Samarkand day has been reached.`,
        });
        return;
      }
      reserved = true;
    }

    const catalog = await loadCatalog();
    const systemInstruction = buildWayZenSystemInstruction(catalog, profile);
    provider = await openGeminiStream(systemInstruction, messages);

    if (userId && conversationId) {
      const [saved] = await db
        .insert(chatMessagesTable)
        .values({
          conversationId,
          role: "user",
          content: messages.at(-1)?.content ?? "",
        })
        .returning({ id: chatMessagesTable.id });
      userMessageId = saved?.id;
    }

    const answer = await relayGeminiStream(provider, res);
    if (userId && conversationId) {
      await db.insert(chatMessagesTable).values({
        conversationId,
        role: "assistant",
        content: answer,
      });
      await db
        .update(conversationsTable)
        .set({ updatedAt: new Date() })
        .where(
          and(
            eq(conversationsTable.id, conversationId),
            eq(conversationsTable.userId, userId),
          ),
        );
    }
    sendSse(res, { done: true });
    res.end();
  } catch {
    if (provider?.body && !res.headersSent) {
      await provider.body.cancel().catch(() => undefined);
    }
    if (!res.headersSent) {
      if (reserved) {
        try {
          await releaseQuota(actorId, "chatUsed");
        } catch {
          // Preserve the provider error response if a best-effort quota release fails.
        }
      }
      if (userMessageId) {
        try {
          await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, userMessageId));
        } catch {
          // An incomplete user message is preferable to hiding the original failure.
        }
      }
    }
    safeAiError(res, res.headersSent);
  }
}

router.post("/ai/routes", async (req, res) => {
  if (!allowBurst(req, res, "route", 4)) return;
  const parsed = GenerateAiRouteBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);

  const userId = getUserId(req);
  let actorId: string;
  try {
    actorId = userId ?? guestActorId(req, res);
  } catch {
    return sendServerError(res);
  }

  let reserved = false;
  try {
    const profile = userId ? await getOrCreateTravelerProfile(userId) : undefined;
    const unlimited = hasActiveTripPass(profile);
    const allPlaces = await loadCatalog();
    const candidates = parsed.data.region
      ? allPlaces.filter((place) => place.region === parsed.data.region)
      : allPlaces;
    if (candidates.length < parsed.data.days) {
      return res.status(422).json({
        error: "There are not enough catalog places for that region and trip length. Choose fewer days or a wider area.",
      });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "WayZen AI is not configured yet." });
    }

    let usedToday: number;
    if (unlimited) {
      usedToday = await getCounter(actorId, "routesUsed");
    } else {
      const reservation = await reserveQuota(
        actorId,
        "routesUsed",
        FREE_ROUTE_DAILY_LIMIT,
      );
      if (reservation === null) {
        const used = await getRouteUsage(actorId);
        return res.status(429).json({
          error: `The free itinerary limit of ${FREE_ROUTE_DAILY_LIMIT} per Samarkand day has been reached (${used}/${FREE_ROUTE_DAILY_LIMIT}).`,
        });
      }
      usedToday = reservation;
      reserved = true;
    }

    const profileForPrompt = profile
      ? {
          interests: [...new Set([...parsed.data.interests, ...profile.interests])],
          pace: parsed.data.pace,
          budget: parsed.data.budget,
          travelStyle: profile.travelStyle,
        }
      : {
          interests: parsed.data.interests,
          pace: parsed.data.pace,
          budget: parsed.data.budget,
          travelStyle: "",
        };
    const systemInstruction = [
      buildWayZenSystemInstruction(candidates, profileForPrompt),
      "For route generation, use only the supplied catalog slugs. Do not add places or factual claims that are not in the catalog.",
      "Return JSON only. The object must have title and days. Each day has day, theme, and stops; each stop has placeSlug and a short note about the itinerary's order, not invented site details.",
      "Do not generate travel or visit times; the application calculates visibly approximate planning estimates from coordinates.",
    ].join("\n\n");
    const prompt = [
      `Create a ${parsed.data.days}-day draft itinerary in ${parsed.data.region ?? "Uzbekistan"}.`,
      `Interests: ${parsed.data.interests.join(", ") || "open-ended exploration"}.`,
      `Pace: ${parsed.data.pace}. Budget preference: ${parsed.data.budget}.`,
      "Use exactly the requested number of days, 1–3 distinct catalog places per day, and no place more than once.",
      "If the catalog does not support a useful route, return an empty days array rather than inventing places.",
    ].join("\n");
    const draft = await generateGeminiJson<RouteDraft>(
      systemInstruction,
      prompt,
      parseRouteDraft,
    );
    const placeBySlug = new Map(candidates.map((place) => [place.slug, place]));
    const seen = new Set<string>();
    const paceMinutes =
      parsed.data.pace === "slow" ? 90 : parsed.data.pace === "balanced" ? 60 : 40;
    const days: TripDayData[] = draft.days.map((day, dayIndex) => {
      if (!Array.isArray(day.stops) || day.stops.length === 0) {
        throw new Error("Gemini returned a day without catalog stops.");
      }
      const stops: TripStopData[] = day.stops.map((stop, stopIndex) => {
        const place = placeBySlug.get(stop.placeSlug);
        if (!place || seen.has(place.slug)) {
          throw new Error("Gemini returned an unknown or repeated place.");
        }
        seen.add(place.slug);
        const previousStop = stopIndex > 0 ? placeBySlug.get(day.stops[stopIndex - 1]!.placeSlug) : undefined;
        const estimatedTravelMinutes = previousStop
          ? estimateRoadMinutes(previousStop, place)
          : 0;
        const note =
          typeof stop.note === "string" && stop.note.trim()
            ? stop.note.trim().slice(0, 400)
            : "Предварительный порядок, предложенный ИИ; фактические условия нужно проверить.";
        return {
          placeSlug: place.slug,
          order: stopIndex + 1,
          estimatedTravelMinutes,
          suggestedVisitMinutes: paceMinutes,
          note,
        };
      });
      return {
        day: dayIndex + 1,
        theme: day.theme.trim().slice(0, 120) || `День ${dayIndex + 1}`,
        stops,
      };
    });
    if (days.length !== parsed.data.days) {
      throw new Error("Gemini returned the wrong number of itinerary days.");
    }
    const approximateTotalMinutes = days
      .flatMap((day) => day.stops)
      .reduce(
        (total, stop) =>
          total + stop.estimatedTravelMinutes + stop.suggestedVisitMinutes,
        0,
      );
    const response = GenerateAiRouteResponse.parse({
      title: draft.title,
      days,
      approximateTotalMinutes,
      remainingRoutesToday: unlimited
        ? -1
        : Math.max(FREE_ROUTE_DAILY_LIMIT - usedToday, 0),
      disclaimer:
        "Архивные точки остаются предварительными. Минуты визита — лишь пожелание по темпу; переезды оценены по координатам, без дорожного маршрутизатора. Это не навигация и не подтверждение доступа, безопасности, часов или цен.",
    });
    return res.json(response);
  } catch {
    if (reserved) {
      try {
        await releaseQuota(actorId, "routesUsed");
      } catch {
        // Keep the failure explicit even if the quota cannot be restored.
      }
    }
    return res.status(502).json({
      error: "Could not build a reliable draft from the current archive. Please try a different area or try again later.",
    });
  }
});

router.post("/wayzen/chat", async (req, res) => {
  const parsed = ChatWithWayZenBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);
  const userId = getUserId(req);
  let actorId: string;
  try {
    actorId = userId ?? guestActorId(req, res);
  } catch {
    return sendServerError(res);
  }
  try {
    const profile = userId ? await getOrCreateTravelerProfile(userId) : undefined;
    await runChatStream({
      req,
      res,
      actorId,
      userId,
      profile,
      messages: parsed.data.messages,
    });
  } catch {
    return sendServerError(res);
  }
});

router.get("/gemini/conversations", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, userId))
      .orderBy(desc(conversationsTable.updatedAt));
    return res.json(ListGeminiConversationsResponse.parse(conversations));
  } catch {
    return sendServerError(res);
  }
});

router.post("/gemini/conversations", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = CreateGeminiConversationBody.safeParse(req.body);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ userId, title: parsed.data.title })
      .returning();
    return res
      .status(201)
      .json(CreateGeminiConversationResponse.parse(conversation));
  } catch {
    return sendServerError(res);
  }
});

router.get("/gemini/conversations/:id", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = GetGeminiConversationParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.userId, userId),
          eq(conversationsTable.id, parsed.data.id),
        ),
      )
      .limit(1);
    if (!conversation) return res.status(404).json({ error: "Chat not found." });
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, conversation.id))
      .orderBy(asc(chatMessagesTable.createdAt), asc(chatMessagesTable.id));
    return res.json(
      GetGeminiConversationResponse.parse({ ...conversation, messages }),
    );
  } catch {
    return sendServerError(res);
  }
});

router.delete("/gemini/conversations/:id", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = DeleteGeminiConversationParams.safeParse(req.params);
  if (!parsed.success) return sendInvalidInput(res);
  try {
    const [deleted] = await db
      .delete(conversationsTable)
      .where(
        and(
          eq(conversationsTable.userId, userId),
          eq(conversationsTable.id, parsed.data.id),
        ),
      )
      .returning({ id: conversationsTable.id });
    if (!deleted) return res.status(404).json({ error: "Chat not found." });
    return res.status(204).send(DeleteGeminiConversationResponse.parse(undefined));
  } catch {
    return sendServerError(res);
  }
});

router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = SendGeminiMessageParams.safeParse(req.params);
  const body = SendGeminiMessageBody.safeParse(req.body);
  if (!params.success || !body.success) return sendInvalidInput(res);
  try {
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, params.data.id),
          eq(conversationsTable.userId, userId),
        ),
      )
      .limit(1);
    if (!conversation) return res.status(404).json({ error: "Chat not found." });
    const profile = await getOrCreateTravelerProfile(userId);
    const previous = await db
      .select({
        role: chatMessagesTable.role,
        content: chatMessagesTable.content,
      })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, conversation.id))
      .orderBy(desc(chatMessagesTable.createdAt), desc(chatMessagesTable.id))
      .limit(11);
    const messages: ChatLine[] = [
      ...previous.reverse(),
      { role: "user", content: body.data.content },
    ];
    await runChatStream({
      req,
      res,
      actorId: userId,
      userId,
      profile,
      messages,
      conversationId: conversation.id,
    });
  } catch {
    return sendServerError(res);
  }
});

function parseRouteDraft(value: unknown): RouteDraft {
  if (!value || typeof value !== "object") {
    throw new Error("Gemini returned an invalid itinerary.");
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.title !== "string" ||
    !candidate.title.trim() ||
    !Array.isArray(candidate.days)
  ) {
    throw new Error("Gemini returned an invalid itinerary.");
  }
  const days = candidate.days.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error("Gemini returned an invalid itinerary day.");
    }
    const day = item as Record<string, unknown>;
    if (
      !Array.isArray(day.stops) ||
      typeof day.theme !== "string" ||
      day.stops.length < 1 ||
      day.stops.length > 3
    ) {
      throw new Error("Gemini returned invalid itinerary stops.");
    }
    return {
      day: typeof day.day === "number" ? day.day : index + 1,
      theme: day.theme,
      stops: day.stops.map((rawStop) => {
        if (!rawStop || typeof rawStop !== "object") {
          throw new Error("Gemini returned an invalid itinerary stop.");
        }
        const stop = rawStop as Record<string, unknown>;
        if (typeof stop.placeSlug !== "string") {
          throw new Error("Gemini returned an invalid place slug.");
        }
        return {
          placeSlug: stop.placeSlug,
          note: typeof stop.note === "string" ? stop.note : "",
        };
      }),
    };
  });
  return { title: candidate.title.trim().slice(0, 120), days };
}

function estimateRoadMinutes(from: Place, to: Place): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = radians(from.latitude);
  const lat2 = radians(to.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = radians(to.longitude - from.longitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const straightLineKm = 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  if (!Number.isFinite(straightLineKm) || straightLineKm < 0.1) return 0;
  const roughRoadKm = straightLineKm * 1.5;
  return Math.max(5, Math.round((roughRoadKm / 40) * 60 / 5) * 5);
}

export default router;
