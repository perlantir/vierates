import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  scheduleBorrowerAuction,
  VerificationFlowError,
} from "@/lib/borrower/verification";
import { readJsonBody, rejectLargePayload } from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const scheduleSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payloadTooLarge = rejectLargePayload(request, 8_192);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = scheduleSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid auction" }, { status: 400 });
  }

  try {
    const auction = await scheduleBorrowerAuction(prisma, {
      borrowerUserId,
      listingId: parsed.data.listingId,
    });

    return NextResponse.json({
      closesAt: auction.closesAt,
      id: auction.id,
      ok: true,
      opensAt: auction.opensAt,
      status: auction.status,
    });
  } catch (error) {
    if (error instanceof VerificationFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Auction could not be scheduled" },
      { status: 500 },
    );
  }
}
