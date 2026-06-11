import { NextResponse } from "next/server";

import {
  BorrowerFlowError,
  createListingFromWizard,
  listingWizardSchema,
} from "@/lib/borrower/wizard";
import {
  enforceRateLimit,
  readJsonBody,
  rejectLargePayload,
} from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 32_768);

  if (payloadTooLarge) {
    return payloadTooLarge;
  }

  const rateLimited = await enforceRateLimit(request, {
    limit: 20,
    prefix: "public:borrower-listings",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = listingWizardSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  }

  try {
    const listing = await createListingFromWizard(prisma, parsed.data);

    return NextResponse.json({
      id: listing.id,
      manualReview: !listing.propertyMatchOk,
      ok: true,
      status: listing.status,
    });
  } catch (error) {
    if (error instanceof BorrowerFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Listing could not be created" },
      { status: 500 },
    );
  }
}
