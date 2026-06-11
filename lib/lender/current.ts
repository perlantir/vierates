import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { demoRuntimeAllowed, e2eRuntimeAllowed } from "@/lib/runtime-mode";

export type CurrentLenderUser = {
  lenderOrgId: string;
  lenderUserId: string;
};

export async function getCurrentLenderOrgId(): Promise<string | null> {
  if (e2eRuntimeAllowed()) {
    const cookieStore = await cookies();
    const orgId = cookieStore.get("vierates_e2e_lender_org_id")?.value;

    if (orgId) {
      const org = await prisma.lenderOrg.findUnique({
        select: { id: true },
        where: { id: orgId },
      });

      if (org) {
        return org.id;
      }
    }
  }

  if (!demoRuntimeAllowed()) {
    const session = await safeAuth();

    if (!session.userId) {
      return null;
    }

    const lenderUser = await prisma.lenderUser.findFirst({
      select: {
        lenderOrgId: true,
        user: {
          select: { role: true },
        },
      },
      where: {
        user: { clerkId: session.userId },
      },
    });

    return lenderUser?.user.role === Role.LENDER
      ? lenderUser.lenderOrgId
      : null;
  }

  const org = await prisma.lenderOrg.findFirst({
    orderBy: { legalName: "asc" },
    select: { id: true },
    where: { status: "APPROVED" },
  });

  return org?.id ?? null;
}

export async function getCurrentLenderUser(): Promise<CurrentLenderUser | null> {
  if (e2eRuntimeAllowed()) {
    const cookieStore = await cookies();
    const lenderUserId = cookieStore.get("vierates_e2e_lender_user_id")?.value;
    const lenderOrgId = cookieStore.get("vierates_e2e_lender_org_id")?.value;

    if (lenderUserId) {
      const lenderUser = await prisma.lenderUser.findUnique({
        select: {
          id: true,
          lenderOrgId: true,
          user: {
            select: { role: true },
          },
        },
        where: { id: lenderUserId },
      });

      if (lenderUser?.user.role === Role.LENDER) {
        return {
          lenderOrgId: lenderUser.lenderOrgId,
          lenderUserId: lenderUser.id,
        };
      }
    }

    if (lenderOrgId) {
      const lenderUser = await prisma.lenderUser.findFirst({
        orderBy: { id: "asc" },
        select: {
          id: true,
          lenderOrgId: true,
          user: {
            select: { role: true },
          },
        },
        where: {
          lenderOrgId,
          user: { role: Role.LENDER },
        },
      });

      if (lenderUser) {
        return {
          lenderOrgId: lenderUser.lenderOrgId,
          lenderUserId: lenderUser.id,
        };
      }
    }
  }

  if (!demoRuntimeAllowed()) {
    const session = await safeAuth();

    if (!session.userId) {
      return null;
    }

    const lenderUser = await prisma.lenderUser.findFirst({
      select: {
        id: true,
        lenderOrgId: true,
        user: {
          select: { role: true },
        },
      },
      where: {
        user: { clerkId: session.userId },
      },
    });

    return lenderUser?.user.role === Role.LENDER
      ? {
          lenderOrgId: lenderUser.lenderOrgId,
          lenderUserId: lenderUser.id,
        }
      : null;
  }

  const lenderUser = await prisma.lenderUser.findFirst({
    orderBy: { id: "asc" },
    select: {
      id: true,
      lenderOrgId: true,
      user: {
        select: { role: true },
      },
    },
    where: {
      lenderOrg: { status: "APPROVED" },
      user: { role: Role.LENDER },
    },
  });

  return lenderUser
    ? { lenderOrgId: lenderUser.lenderOrgId, lenderUserId: lenderUser.id }
    : null;
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
