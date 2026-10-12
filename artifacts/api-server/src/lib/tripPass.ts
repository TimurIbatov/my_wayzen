import type { TravelerProfile } from "@workspace/db";

export function tripPassDurationDays(): number {
  const raw = Number(process.env.STRIPE_TRIP_PASS_DAYS ?? "365");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 365;
}

export function computeTripPassExpiry(from = new Date()): Date {
  const expires = new Date(from);
  expires.setUTCDate(expires.getUTCDate() + tripPassDurationDays());
  return expires;
}

export function hasActiveTripPass(
  profile: Pick<TravelerProfile, "plan" | "tripPassExpiresAt"> | null | undefined,
): boolean {
  if (!profile || profile.plan !== "trip_pass") return false;
  if (!profile.tripPassExpiresAt) return true;
  return profile.tripPassExpiresAt.getTime() > Date.now();
}

export function effectiveTravelPlan(
  profile: Pick<TravelerProfile, "plan" | "tripPassExpiresAt">,
): "free" | "trip_pass" {
  return hasActiveTripPass(profile) ? "trip_pass" : "free";
}

export function offlineMapsFeatureEnabled(): boolean {
  const value = (process.env.OFFLINE_MAPS_ENABLED ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_TRIP_PASS_PRICE_ID?.trim(),
  );
}
