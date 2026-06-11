import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  getMaskedPreviewForBorrower,
  VerificationFlowError,
} from "@/lib/borrower/verification";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const previewSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(request, {
    key: borrowerUserId,
    limit: 60,
    prefix: "borrower:verify-preview",
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

  const parsed = previewSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preview" }, { status: 400 });
  }

  try {
    const preview = await getMaskedPreviewForBorrower(prisma, {
      borrowerUserId,
      listingId: parsed.data.listingId,
    });

    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    if (error instanceof VerificationFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Masked preview could not be loaded" },
      { status: 500 },
    );
  }
}
