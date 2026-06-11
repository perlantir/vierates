import Stripe from "stripe";

import { getEnv } from "@/lib/env";

export const STRIPE_STUBBED = false;

let stripe: Stripe | undefined;

export function getStripeClient(): Stripe {
  stripe ??= new Stripe(getEnv().STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
  });

  return stripe;
}

export function constructStripeWebhookEvent(input: {
  payload: string;
  signature: string | null;
}): Stripe.Event | null {
  if (!input.signature) {
    return null;
  }

  try {
    return getStripeClient().webhooks.constructEvent(
      input.payload,
      input.signature,
      getEnv().STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return null;
  }
}
