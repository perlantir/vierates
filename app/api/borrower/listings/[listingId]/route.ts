import { NextResponse } from "next/server";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { deleteBorrowerListingAndVault } from "@/lib/borrower/dashboard";
import { prisma } from "@/lib/prisma";

type ListingRouteContext = {
  params: Promise<{ listingId: string }>;
};

export async function DELETE(request: Request, context: ListingRouteContext) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const { listingId } = await context.params;

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listing = await deleteBorrowerListingAndVault(prisma, {
      borrowerUserId,
      ip: requestIp(request),
      listingId,
    });

    return NextResponse.json({
      deletedAt: listing.deletedAt,
      ok: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Listing could not be deleted" },
      { status: 404 },
    );
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
