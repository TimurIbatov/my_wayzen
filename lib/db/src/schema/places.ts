import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type PlaceVerificationStatus =
  | "draft"
  | "preliminary"
  | "verified"
  | "stale";

export const placesTable = pgTable(
  "wayzen_places",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    nameRu: text("name_ru").notNull(),
    nameEn: text("name_en").notNull(),
    nameUz: text("name_uz"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    region: text("region").notNull(),
    category: text("category").notNull(),
    kind: text("kind").notNull(),
    summaryRu: text("summary_ru").notNull(),
    summaryEn: text("summary_en").notNull(),
    storyRu: text("story_ru").notNull(),
    storyEn: text("story_en").notNull(),
    practicalNotesRu: text("practical_notes_ru").notNull(),
    practicalNotesEn: text("practical_notes_en").notNull(),
    imageUrls: text("image_urls")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    seasonality: text("seasonality")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    accessDifficulty: text("access_difficulty").notNull(),
    verificationStatus: text("verification_status")
      .$type<PlaceVerificationStatus>()
      .notNull()
      .default("preliminary"),
    source: text("source").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("wayzen_places_status_idx").on(table.verificationStatus),
    index("wayzen_places_region_idx").on(table.region),
    index("wayzen_places_category_idx").on(table.category),
  ],
);

export const insertPlaceSchema = createInsertSchema(placesTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof placesTable.$inferSelect;
