import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { prisma } from "@/lib/prisma";
import {
  createPostRevealRating,
  ReputationServiceError,
} from "@/lib/services/reputation";

const ratingSchema = z.object({
  comment: z.string().max(500).optional(),
  lenderOrgId: z.string().min(1),
  listingId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const parsed = ratingSchema.safeParse(await request.json());

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  try {
    const rating = await createPostRevealRating(prisma, {
      ...parsed.data,
      borrowerUserId,
    });

    return NextResponse.json({ id: rating.id, ok: true });
  } catch (error) {
    if (error instanceof ReputationServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Rating failed" }, { status: 500 });
  }
}
