import { NextResponse } from "next/server";
import { z } from "zod";

import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const waitlistSchema = z.object({
  email: z.string().email(),
  source: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 8_192);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 20,
    prefix: "public:waitlist",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = waitlistSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid waitlist entry" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  await prisma.waitlistEntry.upsert({
    where: { email },
    update: {
      source: parsed.data.source,
    },
    create: {
      email,
      source: parsed.data.source,
    },
  });

  return NextResponse.json({ ok: true });
}
