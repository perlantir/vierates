import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  scheduleBorrowerAuction,
  VerificationFlowError,
} from "@/lib/borrower/verification";
import { prisma } from "@/lib/prisma";

const scheduleSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const parsed = scheduleSchema.safeParse(await request.json());

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
