import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  recordCreditVerification,
  VerificationFlowError,
} from "@/lib/borrower/verification";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  listingId: z.string().min(1),
  simulateFailure: z.boolean().optional(),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(request, {
    key: borrowerUserId,
    limit: 30,
    prefix: "borrower:verify-credit",
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

  const parsed = verifySchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid verification" },
      { status: 400 },
    );
  }

  try {
    const result = await recordCreditVerification(prisma, {
      borrowerUserId,
      ip: requestIp(request),
      listingId: parsed.data.listingId,
      simulateFailure: parsed.data.simulateFailure,
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({
      ok: true,
      status:
        "verificationBundle" in result
          ? result.verificationBundle.status
          : "MANUAL_REVIEW",
    });
  } catch (error) {
    if (error instanceof VerificationFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Credit verification failed" },
      { status: 500 },
    );
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
