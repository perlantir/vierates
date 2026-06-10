import { NextResponse } from "next/server";

import {
  BorrowerFlowError,
  matchPropertyForListing,
  propertyMatchSchema,
} from "@/lib/borrower/wizard";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const parsed = propertyMatchSchema.safeParse(await request.json());

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
