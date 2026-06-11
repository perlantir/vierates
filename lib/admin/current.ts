import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function getCurrentAdminUserId(): Promise<string | null> {
  if (process.env.VIERATES_E2E === "true") {
    return "e2e-admin";
  }

  const session = await auth();

  if (!session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    select: { id: true, role: true },
    where: { clerkId: session.userId },
  });

  return user?.role === Role.ADMIN ? user.id : null;
}
