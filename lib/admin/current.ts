import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { e2eRuntimeAllowed } from "@/lib/runtime-mode";

export async function getCurrentAdminUserId(): Promise<string | null> {
  if (e2eRuntimeAllowed()) {
    return "e2e-admin";
  }

  const session = await safeAuth();

  if (!session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    select: { id: true, role: true },
    where: { clerkId: session.userId },
  });

  return user?.role === Role.ADMIN ? user.id : null;
}

async function safeAuth(): ReturnType<typeof auth> {
  try {
    return await auth();
  } catch {
    return {
      userId: null,
    } as Awaited<ReturnType<typeof auth>>;
  }
}
