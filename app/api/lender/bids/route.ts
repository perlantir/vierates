import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentLenderUser } from "@/lib/lender/current";
import { readJsonBody, rejectLargePayload } from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";
import { checkFixedWindowRateLimit } from "@/lib/rate-limit";
import { AuctionServiceError, submitBid } from "@/lib/services/auction";

const bidFeeSchema = z.object({
  amountCents: z.number().int().min(0).max(500_000),
  financeCharge: z.boolean(),
  label: z.string().min(1).max(80),
});

const bidSchema = z.object({
  auctionId: z.string().min(1),
  conditions: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8),
  itemizedFees: z.array(bidFeeSchema).default([]),
  lockDays: z.number().int().min(15).max(180),
  points: z.number().min(-5).max(5),
  product: z.string().min(2),
  program: z.string().min(2),
  rateBp: z.number().int().min(100).max(2000),
});

export async function POST(request: Request) {
  const lenderUser = await getCurrentLenderUser();

  if (!lenderUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payloadTooLarge = rejectLargePayload(request, 16_384);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = bidSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bid" }, { status: 400 });
  }

  const rateLimit = await checkFixedWindowRateLimit({
    key: lenderUser.lenderOrgId,
    limit: 30,
    prefix: "lender:bids",
    window: "1 m",
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many bid attempts" },
      { status: 429 },
    );
  }

  try {
    const bid = await submitBid(prisma, {
      ...parsed.data,
      lenderOrgId: lenderUser.lenderOrgId,
      lenderUserId: lenderUser.lenderUserId,
    });

    return NextResponse.json({
      aprBp: bid.aprBp,
      id: bid.id,
      ok: true,
      status: bid.status,
    });
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Bid could not be saved" },
      { status: 500 },
    );
  }
}
