import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectLargePayload } from "@/lib/http/request-guards";
import {
  BILLING_REASONS,
  BillingServiceError,
  grantCredits,
  verifyStripeWebhookSignature,
} from "@/lib/services/billing";
import { prisma } from "@/lib/prisma";
import { checkFixedWindowRateLimit } from "@/lib/rate-limit";

const stripeEventSchema = z.object({
  credits: z.number().int().positive(),
  id: z.string().min(1),
  lenderOrgId: z.string().min(1),
  type: z.enum(["invoice.paid", "checkout.session.completed"]),
});

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 1_048_576);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimit = await checkFixedWindowRateLimit({
    key: requestIp(request),
    limit: 120,
    prefix: "webhooks:stripe",
    window: "1 m",
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many webhook attempts" },
      { status: 429 },
    );
  }

  const rawBody = await request.text();
  const event = verifyStripeWebhookSignature({
    payload: rawBody,
    signature: request.headers.get("stripe-signature"),
  });

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = stripeEventSchema.safeParse(stripeBillingEvent(event));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const reason =
    parsed.data.type === "invoice.paid"
      ? BILLING_REASONS.GRANT
      : BILLING_REASONS.PACK;

  try {
    const transaction = await grantCredits(prisma, {
      credits: parsed.data.credits,
      idempotencyKey: `stripe:${parsed.data.id}`,
      lenderOrgId: parsed.data.lenderOrgId,
      reason,
      stripeRef: parsed.data.id,
    });

    return NextResponse.json({
      id: transaction.id,
      ok: true,
    });
  } catch (error) {
    if (error instanceof BillingServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Billing event failed" },
      { status: 500 },
    );
  }
}

function stripeBillingEvent(event: {
  data: { object: unknown };
  id: string;
  type: string;
}) {
  const object = event.data.object as { metadata?: Record<string, string> };
  const metadata = object.metadata ?? {};

  return {
    credits: Number(metadata.credits),
    id: event.id,
    lenderOrgId: metadata.lenderOrgId,
    type: event.type,
  };
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
