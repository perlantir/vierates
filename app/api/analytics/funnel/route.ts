import { NextResponse } from "next/server";
import { z } from "zod";

import { captureBorrowerFunnelEvent } from "@/lib/borrower/wizard";
import { getPostHogClient } from "@/lib/observability/posthog";
import { prisma } from "@/lib/prisma";

const funnelSchema = z.object({
  event: z.enum(["wizard_step_viewed", "wizard_step_completed"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().min(8),
  step: z.string().min(1),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const parsed = funnelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  await captureBorrowerFunnelEvent(prisma, {
    event: parsed.data.event,
    metadata: JSON.parse(JSON.stringify(parsed.data.metadata ?? {})),
    sessionId: parsed.data.sessionId,
    step: parsed.data.step,
    userId: parsed.data.userId,
  });

  try {
    getPostHogClient().capture({
      distinctId: parsed.data.sessionId,
      event: parsed.data.event,
      properties: {
        step: parsed.data.step,
        ...(parsed.data.metadata ?? {}),
      },
    });
  } catch {
    // Local persistence is the source of truth for tests and dev when PostHog is unavailable.
  }

  return NextResponse.json({ ok: true });
}
