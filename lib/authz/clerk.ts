import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import type { Actor } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function getActorFromClerk(): Promise<Actor | null> {
  const session = await safeAuth();

  if (!session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    select: {
      id: true,
      lenderUser: {
        select: {
          lenderOrgId: true,
          orgRole: true,
        },
      },
      role: true,
    },
    where: { clerkId: session.userId },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    lenderOrgId:
      user.role === Role.LENDER ? user.lenderUser?.lenderOrgId : undefined,
    orgRole:
      user.role === Role.LENDER
        ? parseOrgRole(user.lenderUser?.orgRole)
        : undefined,
  };
}

async function safeAuth(): Promise<Awaited<ReturnType<typeof auth>>> {
  try {
    return await auth();
  } catch {
    return { userId: null } as Awaited<ReturnType<typeof auth>>;
  }
}

function parseOrgRole(value: unknown): Actor["orgRole"] | undefined {
  return value === "ORG_ADMIN" || value === "LO" ? value : undefined;
}
