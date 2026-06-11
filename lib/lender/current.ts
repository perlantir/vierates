import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export async function getCurrentLenderOrgId(): Promise<string | null> {
  if (process.env.VIERATES_E2E === "true") {
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

  if (process.env.DEMO_MODE !== "true") {
    const session = await auth();

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
