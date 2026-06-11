import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdminUserId } from "@/lib/admin/current";
import { readJsonBody, rejectLargePayload } from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";
import { resolveDisputeCase } from "@/lib/services/reputation";

type ResolveContext = {
  params: Promise<{ disputeId: string }>;
};

const resolveSchema = z.object({
  resolution: z.string().min(2),
});

export async function POST(request: Request, context: ResolveContext) {
  const adminUserId = await getCurrentAdminUserId();
  const { disputeId } = await context.params;

  if (!adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payloadTooLarge = rejectLargePayload(request, 8_192);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = resolveSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  const result = await resolveDisputeCase(prisma, {
    disputeId,
    resolution: parsed.data.resolution,
  });

  return NextResponse.json({
    ok: true,
    status: result.dispute.status,
    violationCount: result.violationCount,
  });
}
