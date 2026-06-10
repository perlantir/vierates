import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentLenderOrgId } from "@/lib/lender/current";
import { prisma } from "@/lib/prisma";
import { AuctionServiceError, submitBid } from "@/lib/services/auction";

const bidSchema = z.object({
  auctionId: z.string().min(1),
  conditions: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8),
  itemizedFees: z.array(z.number().min(0)).default([]),
  lockDays: z.number().int().min(15).max(180),
  points: z.number().min(-5).max(5),
  product: z.string().min(2),
  program: z.string().min(2),
  rateBp: z.number().int().min(100).max(2000),
});

export async function POST(request: Request) {
  const lenderOrgId = await getCurrentLenderOrgId();
  const parsed = bidSchema.safeParse(await request.json());

  if (!lenderOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bid" }, { status: 400 });
  }

  const lenderUser = await prisma.lenderUser.findFirst({
    where: { lenderOrgId },
  });

  if (!lenderUser) {
    return NextResponse.json({ error: "No lender user" }, { status: 403 });
  }

  try {
    const bid = await submitBid(prisma, {
      ...parsed.data,
      lenderOrgId,
      lenderUserId: lenderUser.id,
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
