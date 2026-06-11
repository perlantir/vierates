import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
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

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(request, {
    key: borrowerUserId,
    limit: 20,
    prefix: "borrower:ratings",
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

  const parsed = ratingSchema.safeParse(body.value);

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
