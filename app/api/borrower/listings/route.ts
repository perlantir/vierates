import { NextResponse } from "next/server";

import {
  BorrowerFlowError,
  createListingFromWizard,
  listingWizardSchema,
} from "@/lib/borrower/wizard";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const parsed = listingWizardSchema.safeParse(await request.json());

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
