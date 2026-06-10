import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function getCurrentBorrowerUserId(): Promise<string | null> {
  if (process.env.VIERATES_E2E === "true" || process.env.DEMO_MODE === "true") {
    const newestListing = await prisma.listing.findFirst({
      orderBy: { createdAt: "desc" },
      select: { borrowerUserId: true },
      where: {
        borrower: { role: Role.BORROWER },
        deletedAt: null,
      },
    });

    return newestListing?.borrowerUserId ?? null;
  }

  const session = await auth();

  if (!session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    select: { id: true, role: true },
    where: { clerkId: session.userId },
  });

  return user?.role === Role.BORROWER ? user.id : null;
}
