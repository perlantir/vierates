import { StateStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdminUserId } from "@/lib/admin/current";
import { readJsonBody, rejectLargePayload } from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const stateRuleSchema = z.object({
  notes: z.string().max(500).optional(),
  state: z.string().length(2),
  status: z.enum([StateStatus.GREEN, StateStatus.YELLOW, StateStatus.RED]),
});

export async function POST(request: Request) {
  const adminUserId = await getCurrentAdminUserId();

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

  const parsed = stateRuleSchema.safeParse(body.value);

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
