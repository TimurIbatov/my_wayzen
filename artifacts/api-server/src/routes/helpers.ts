import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";

export function requireUserId(req: Request, res: Response): string | null {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return null;
  }
  return userId;
}

export function getUserId(req: Request): string | null {
  // When CLERK_SECRET_KEY is unset, clerkMiddleware is not mounted and getAuth throws.
  // Treat that as signed-out so public catalog still works and gated routes return 401.
  try {
    const auth = getAuth(req);
    const claimUserId = (
      auth.sessionClaims as { userId?: unknown } | null | undefined
    )?.userId;
    const userId =
      typeof claimUserId === "string" ? claimUserId : auth.userId;
    if (userId) return userId;
  } catch {
    // Clerk middleware not mounted — fall through to optional local stub.
  }

  // Local-only signed-in stub when Clerk is unset (never in production).
  // SPA sets Authorization: Bearer dev-local via VITE_WAYZEN_DEV_AUTH=1.
  const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();
  const devUserId = process.env.WAYZEN_DEV_USER_ID?.trim();
  if (!clerkSecret && process.env.NODE_ENV !== "production" && devUserId) {
    const headerUser = req.header("x-wayzen-dev-user")?.trim();
    if (headerUser === devUserId) return devUserId;
    const authorization = req.header("authorization")?.trim();
    if (
      authorization === `Bearer ${devUserId}` ||
      authorization === "Bearer dev-local"
    ) {
      return devUserId;
    }
  }

  return null;
}

export function isWayZenAdmin(userId: string): boolean {
  const allowlist = (process.env.WAYZEN_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowlist.includes(userId);
}

export function requireAdminId(req: Request, res: Response): string | null {
  const userId = requireUserId(req, res);
  if (!userId) return null;
  if (!isWayZenAdmin(userId)) {
    res.status(403).json({ error: "Moderator access is required." });
    return null;
  }
  return userId;
}

export function sendInvalidInput(res: Response): void {
  res.status(400).json({ error: "The request did not match the expected format." });
}

export function sendServerError(res: Response): void {
  res.status(500).json({ error: "The request could not be completed." });
}

/** Postgres unique_violation — e.g. duplicate place slug on create. */
export function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505",
  );
}
