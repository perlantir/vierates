import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";
import { AuctionServiceError, pickWinningBid } from "@/lib/services/auction";

type PickContext = {
  params: Promise<{ auctionId: string }>;
};

const pickSchema = z.object({
  bidId: z.string().min(1),
});

export async function POST(request: Request, context: PickContext) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const { auctionId } = await context.params;

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(request, {
    key: borrowerUserId,
    limit: 10,
    prefix: "borrower:auction-pick",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const payloadTooLarge = rejectLargePayload(request, 8_192);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = pickSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid pick" }, { status: 400 });
  }

  try {
    const { consentRecord, identityGrant } = await pickWinningBid(prisma, {
      auctionId,
      bidId: parsed.data.bidId,
      borrowerUserId,
      ip: requestIp(request),
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({
      consentRecordId: consentRecord.id,
      identityGrantId: identityGrant.id,
      ok: true,
    });
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Bid could not be picked" },
      { status: 500 },
    );
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
