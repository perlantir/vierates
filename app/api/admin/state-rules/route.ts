import { StateStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const stateRuleSchema = z.object({
  notes: z.string().max(500).optional(),
  state: z.string().length(2),
  status: z.enum([StateStatus.GREEN, StateStatus.YELLOW, StateStatus.RED]),
});

export async function POST(request: Request) {
  const parsed = stateRuleSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid state rule" }, { status: 400 });
  }

  const stateRule = await prisma.stateRule.upsert({
    create: parsed.data,
    update: {
      notes: parsed.data.notes,
      status: parsed.data.status,
    },
    where: { state: parsed.data.state },
  });

  await prisma.auditLog.create({
    data: {
      action: "admin.state_rule_updated",
      entity: "StateRule",
      entityId: stateRule.state,
      meta: {
        status: stateRule.status,
      },
    },
  });

  return NextResponse.json({ ok: true, stateRule });
}
