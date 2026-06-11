import { NextResponse } from "next/server";

import {
  BorrowerFlowError,
  matchPropertyForListing,
  propertyMatchSchema,
} from "@/lib/borrower/wizard";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 16_384);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 60,
    prefix: "public:property-match",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = propertyMatchSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid property" }, { status: 400 });
  }

  try {
    const match = await matchPropertyForListing(prisma, parsed.data);
    return NextResponse.json(match);
  } catch (error) {
    if (error instanceof BorrowerFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Property match failed" },
      { status: 500 },
    );
  }
}
