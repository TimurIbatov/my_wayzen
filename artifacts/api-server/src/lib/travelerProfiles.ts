import { eq } from "drizzle-orm";
import { db, travelerProfilesTable } from "@workspace/db";

export async function getOrCreateTravelerProfile(userId: string) {
  const [existing] = await db
    .select()
    .from(travelerProfilesTable)
    .where(eq(travelerProfilesTable.userId, userId))
    .limit(1);
  if (existing) return existing;

  await db
    .insert(travelerProfilesTable)
    .values({ userId })
    .onConflictDoNothing();

  const [created] = await db
    .select()
    .from(travelerProfilesTable)
    .where(eq(travelerProfilesTable.userId, userId))
    .limit(1);
  if (!created) throw new Error("Could not create the travel profile.");
  return created;
}
