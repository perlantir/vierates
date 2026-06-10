import { NextResponse } from "next/server";
import { z } from "zod";

import { saveListingDraft } from "@/lib/borrower/wizard";
import { prisma } from "@/lib/prisma";

const draftSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  phone: z.string().optional(),
  resumeToken: z.string().optional(),
  state: z.string().length(2).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const draft = await prisma.listingDraft.findUnique({
    where: { resumeToken: token },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: draft.data,
    resumeToken: draft.resumeToken,
    state: draft.state,
  });
}

export async function POST(request: Request) {
  const parsed = draftSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  }

  const draft = await saveListingDraft(prisma, {
    data: JSON.parse(JSON.stringify(parsed.data.data)),
    phone: parsed.data.phone,
    resumeToken: parsed.data.resumeToken,
    state: parsed.data.state,
  });

  return NextResponse.json({
    resumeToken: draft.resumeToken,
    resumeUrl: `/app/new?resume=${draft.resumeToken}`,
  });
}
