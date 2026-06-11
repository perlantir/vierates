import { NextResponse } from "next/server";
import { z } from "zod";

import { captureBorrowerFunnelEvent } from "@/lib/borrower/wizard";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { getPostHogClient } from "@/lib/observability/posthog";
import { prisma } from "@/lib/prisma";

const funnelSchema = z.object({
  event: z.enum(["page_view", "wizard_step_viewed", "wizard_step_completed"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().min(8).max(128),
  step: z.string().min(1).max(80),
  userId: z.string().max(128).optional(),
});

const allowedMetadataKeys = new Set([
  "field",
  "gated",
  "path",
  "propertyMatchOk",
  "surface",
  "state",
]);

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 16_384);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 120,
    prefix: "public:funnel",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const parsed = funnelSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  if (JSON.stringify(parsed.data.metadata ?? {}).length > 4096) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const metadata = sanitizeMetadata(parsed.data.metadata ?? {});

  await captureBorrowerFunnelEvent(prisma, {
    event: parsed.data.event,
    metadata,
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
        ...metadata,
      },
    });
  } catch {
    // Local persistence is the source of truth for tests and dev when PostHog is unavailable.
  }

  return NextResponse.json({ ok: true });
}

function sanitizeMetadata(metadata: Record<string, unknown>) {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (
      !allowedMetadataKeys.has(key) ||
      !["boolean", "number", "string"].includes(typeof value)
    ) {
      continue;
    }

    sanitized[key] = value as string | number | boolean;
  }

  return sanitized;
}
