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
  let auth: ReturnType<typeof getAuth>;
  try {
    auth = getAuth(req);
  } catch {
    return null;
  }
  const claimUserId = (
    auth.sessionClaims as { userId?: unknown } | null | undefined
  )?.userId;
  const userId =
    typeof claimUserId === "string" ? claimUserId : auth.userId;

  return userId ?? null;
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
