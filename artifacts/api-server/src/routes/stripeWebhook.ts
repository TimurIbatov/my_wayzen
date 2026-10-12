import type { Request, Response } from "express";
import { db, travelerProfilesTable } from "@workspace/db";
import { getStripe } from "../lib/stripe";
import { computeTripPassExpiry } from "../lib/tripPass";

export async function stripeWebhookHandler(req: Request, res: Response) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: "Stripe webhook is not configured." });
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature." });
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: "Webhook expects a raw request body." });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return res.status(400).json({ error: "Invalid Stripe webhook signature." });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id || undefined;
      const product = session.metadata?.product;
      const paid =
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required";
      if (userId && product === "trip_pass" && paid) {
        const expiresAt = computeTripPassExpiry();
        await db
          .insert(travelerProfilesTable)
          .values({ userId, plan: "trip_pass", tripPassExpiresAt: expiresAt })
          .onConflictDoUpdate({
            target: travelerProfilesTable.userId,
            set: { plan: "trip_pass", tripPassExpiresAt: expiresAt },
          });
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed.", error);
    return res.status(500).json({ error: "Webhook handler failed." });
  }
}
