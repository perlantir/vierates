import { NextResponse } from "next/server";
import { z } from "zod";

import { smsOptInText } from "@/lib/borrower/shared";
import {
  BorrowerFlowError,
  normalizePhone,
  startOtpChallenge,
} from "@/lib/borrower/wizard";
import { IntegrationUnavailableError } from "@/lib/integrations/stub-guard";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const startSchema = z.object({
  phone: z.string().min(10),
});

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 8_192);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 20,
    prefix: "public:otp-start",
    window: "15 m",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = startSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  try {
    const challenge = await startOtpChallenge(prisma, {
      ip: requestIp(request),
      phone: parsed.data.phone,
    });

    return NextResponse.json({
      challengeId: challenge.id,
      consentText: smsOptInText(normalizePhone(parsed.data.phone)),
      demoCode: challenge.demoCode,
      ok: true,
    });
  } catch (error) {
    if (error instanceof BorrowerFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof IntegrationUnavailableError) {
      return NextResponse.json(
        { code: error.code, error: "Verification provider unavailable" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Verification could not start" },
      { status: 500 },
    );
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
