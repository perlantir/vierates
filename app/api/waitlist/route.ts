import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const waitlistSchema = z.object({
  email: z.string().email(),
  source: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const parsed = waitlistSchema.safeParse(await request.json());

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
