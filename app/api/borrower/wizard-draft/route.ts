import { NextResponse } from "next/server";
import { z } from "zod";

import { saveListingDraft } from "@/lib/borrower/wizard";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

const draftSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  resumeToken: z.string().optional(),
  state: z.string().length(2).optional(),
});

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(request, {
    limit: 120,
    prefix: "public:wizard-draft-read",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

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
  const payloadTooLarge = rejectLargePayload(request, 32_768);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 60,
    prefix: "public:wizard-draft",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = draftSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  }

  const draft = await saveListingDraft(prisma, {
    data: sanitizeDraftData(parsed.data.data),
    resumeToken: parsed.data.resumeToken,
    state: parsed.data.state,
  });

  return NextResponse.json({
    resumeToken: draft.resumeToken,
    resumeUrl: `/app/new?resume=${draft.resumeToken}`,
  });
}

function sanitizeDraftData(data: Record<string, unknown>) {
  return JSON.parse(
    JSON.stringify({
      balanceAmount: data.balanceAmount,
      county: data.county,
      creditBandStated: data.creditBandStated,
      currentRateBand: data.currentRateBand,
      estValueAmount: data.estValueAmount,
      incomeBandStated: data.incomeBandStated,
      occupancy: data.occupancy,
      propertyMatchOk: data.propertyMatchOk,
      propertyType: data.propertyType,
      purpose: data.purpose,
      state: data.state,
      timeline: data.timeline,
    }),
  );
}
