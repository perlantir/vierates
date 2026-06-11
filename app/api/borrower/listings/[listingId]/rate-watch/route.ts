import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { setRateWatchFlag } from "@/lib/borrower/dashboard";
import { readJsonBody, rejectLargePayload } from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

type RateWatchRouteContext = {
  params: Promise<{ listingId: string }>;
};

const rateWatchSchema = z.object({
  enabled: z.boolean(),
});

export async function POST(request: Request, context: RateWatchRouteContext) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const { listingId } = await context.params;

  if (!borrowerUserId) {
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

  const parsed = rateWatchSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  }

  try {
    const listing = await setRateWatchFlag(prisma, {
      borrowerUserId,
      enabled: parsed.data.enabled,
      listingId,
    });

    return NextResponse.json({
      enabled: listing.rateWatchNurtureFlag,
      ok: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Rate watch could not be updated" },
      { status: 404 },
    );
  }
}
