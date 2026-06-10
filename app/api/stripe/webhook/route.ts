import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BILLING_REASONS,
  BillingServiceError,
  grantCredits,
  verifyStripeWebhookSignature,
} from "@/lib/services/billing";
import { prisma } from "@/lib/prisma";

const stripeEventSchema = z.object({
  credits: z.number().int().positive(),
  id: z.string().min(1),
  lenderOrgId: z.string().min(1),
  type: z.enum(["invoice.paid", "checkout.session.completed"]),
});

export async function POST(request: Request) {
  if (!verifyStripeWebhookSignature(request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = stripeEventSchema.safeParse(await request.json());

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
