import { NextResponse } from "next/server";

import {
  createPendingLenderOrg,
  lenderOnboardingSchema,
} from "@/lib/lender/onboarding";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 32_768);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 10,
    prefix: "public:lender-onboarding",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = lenderOnboardingSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding" }, { status: 400 });
  }

  const org = await createPendingLenderOrg(prisma, parsed.data);

  return NextResponse.json({
    id: org.id,
    ok: true,
    status: org.status,
  });
}
