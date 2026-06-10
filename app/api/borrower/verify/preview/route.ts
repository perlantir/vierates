import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  getMaskedPreviewForBorrower,
  VerificationFlowError,
} from "@/lib/borrower/verification";
import { prisma } from "@/lib/prisma";

const previewSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const parsed = previewSchema.safeParse(await request.json());

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preview" }, { status: 400 });
  }

  try {
    const preview = await getMaskedPreviewForBorrower(prisma, {
      borrowerUserId,
      listingId: parsed.data.listingId,
    });

    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    if (error instanceof VerificationFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Masked preview could not be loaded" },
      { status: 500 },
    );
  }
}
