import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { resolveDisputeCase } from "@/lib/services/reputation";

type ResolveContext = {
  params: Promise<{ disputeId: string }>;
};

const resolveSchema = z.object({
  resolution: z.string().min(2),
});

export async function POST(request: Request, context: ResolveContext) {
  const parsed = resolveSchema.safeParse(await request.json());
  const { disputeId } = await context.params;

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
