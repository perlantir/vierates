import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export async function getCurrentBorrowerUserId(): Promise<string | null> {
  if (process.env.VIERATES_E2E === "true") {
    const cookieStore = await cookies();
    const e2eBorrowerUserId = cookieStore.get(
      "vierates_e2e_borrower_user_id",
    )?.value;

    if (e2eBorrowerUserId) {
      const user = await prisma.user.findFirst({
        select: { id: true },
        where: {
          id: e2eBorrowerUserId,
          role: Role.BORROWER,
        },
      });

      if (user) {
        return user.id;
      }
    }
  }

  if (process.env.VIERATES_E2E === "true" || demoAuthFallbackAllowed()) {
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

function demoAuthFallbackAllowed(): boolean {
  return (
    process.env.DEMO_MODE === "true" &&
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production"
  );
}
