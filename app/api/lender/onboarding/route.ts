import { NextResponse } from "next/server";

import {
  createPendingLenderOrg,
  lenderOnboardingSchema,
} from "@/lib/lender/onboarding";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const parsed = lenderOnboardingSchema.safeParse(await request.json());

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
