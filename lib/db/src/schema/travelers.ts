import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { placesTable } from "./places";

export type TripStopData = {
  placeSlug: string;
  order: number;
  estimatedTravelMinutes: number;
  suggestedVisitMinutes: number;
  note: string;
};

export type TripDayData = {
  day: number;
  theme: string;
  stops: TripStopData[];
};

export type TravelPace = "slow" | "balanced" | "packed";
export type TravelBudget = "budget" | "moderate" | "comfort";
export type TravelPlan = "free" | "trip_pass";

export const travelerProfilesTable = pgTable("wayzen_traveler_profiles", {
  userId: text("user_id").primaryKey(),
  interests: text("interests")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  pace: text("pace").$type<TravelPace>().notNull().default("balanced"),
  budget: text("budget").$type<TravelBudget>().notNull().default("moderate"),
  travelStyle: text("travel_style").notNull().default(""),
  plan: text("plan").$type<TravelPlan>().notNull().default("free"),
  tripPassExpiresAt: timestamp("trip_pass_expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertTravelerProfileSchema = createInsertSchema(
  travelerProfilesTable,
).omit({ updatedAt: true });
export type InsertTravelerProfile = z.infer<
  typeof insertTravelerProfileSchema
>;
export type TravelerProfile = typeof travelerProfilesTable.$inferSelect;

export const favoritesTable = pgTable(
  "wayzen_favorites",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    placeSlug: text("place_slug")
      .notNull()
      .references(() => placesTable.slug, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("wayzen_favorites_user_place_idx").on(
      table.userId,
      table.placeSlug,
    ),
    index("wayzen_favorites_user_idx").on(table.userId),
  ],
);

export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favoritesTable.$inferSelect;

export const tripsTable = pgTable(
  "wayzen_trips",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    days: jsonb("days").$type<TripDayData[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("wayzen_trips_user_idx").on(table.userId)],
);

export const insertTripSchema = createInsertSchema(tripsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;

export const aiUsageTable = pgTable(
  "wayzen_ai_usage",
  {
    actorId: text("actor_id").notNull(),
    usageDate: date("usage_date", { mode: "string" }).notNull(),
    routesUsed: integer("routes_used").notNull().default(0),
    chatUsed: integer("chat_used").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.actorId, table.usageDate] }),
    index("wayzen_ai_usage_date_idx").on(table.usageDate),
  ],
);
