import { StateStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdminUserId } from "@/lib/admin/current";
import { prisma } from "@/lib/prisma";

const stateRuleSchema = z.object({
  notes: z.string().max(500).optional(),
  state: z.string().length(2),
  status: z.enum([StateStatus.GREEN, StateStatus.YELLOW, StateStatus.RED]),
});

export async function POST(request: Request) {
  const adminUserId = await getCurrentAdminUserId();
  const parsed = stateRuleSchema.safeParse(await request.json());

  if (!adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      actorUserId: adminUserId === "e2e-admin" ? undefined : adminUserId,
      entity: "StateRule",
      entityId: stateRule.state,
      meta: {
        status: stateRule.status,
      },
    },
  });

  return NextResponse.json({ ok: true, stateRule });
}
