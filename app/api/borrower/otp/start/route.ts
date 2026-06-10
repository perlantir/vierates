import { NextResponse } from "next/server";
import { z } from "zod";

import { smsOptInText } from "@/lib/borrower/shared";
import {
  BorrowerFlowError,
  demoOtpCode,
  normalizePhone,
  startOtpChallenge,
} from "@/lib/borrower/wizard";
import { prisma } from "@/lib/prisma";

const startSchema = z.object({
  phone: z.string().min(10),
});

export async function POST(request: Request) {
  const parsed = startSchema.safeParse(await request.json());

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
      demoCode: process.env.DEMO_MODE === "true" ? demoOtpCode : undefined,
      ok: true,
    });
  } catch (error) {
    if (error instanceof BorrowerFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
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
