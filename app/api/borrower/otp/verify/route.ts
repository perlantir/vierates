import { NextResponse } from "next/server";
import { z } from "zod";

import { BorrowerFlowError, verifyOtpChallenge } from "@/lib/borrower/wizard";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(4).max(12),
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  try {
    const verification = await verifyOtpChallenge(prisma, {
      challengeId: parsed.data.challengeId,
      code: parsed.data.code,
      ip: requestIp(request),
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ ok: true, ...verification });
  } catch (error) {
    if (error instanceof BorrowerFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
