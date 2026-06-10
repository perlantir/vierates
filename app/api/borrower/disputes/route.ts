import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { prisma } from "@/lib/prisma";
import {
  createDisputeCase,
  ReputationServiceError,
} from "@/lib/services/reputation";

const disputeSchema = z.object({
  lenderOrgId: z.string().min(1),
  listingId: z.string().min(1),
  summary: z.string().min(5).max(1000),
  type: z.string().min(2),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const parsed = disputeSchema.safeParse(await request.json());

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dispute" }, { status: 400 });
  }

  try {
    const dispute = await createDisputeCase(prisma, {
      ...parsed.data,
      borrowerUserId,
    });

    return NextResponse.json({ id: dispute.id, ok: true });
  } catch (error) {
    if (error instanceof ReputationServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Dispute failed" }, { status: 500 });
  }
}
