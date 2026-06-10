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

  const org = await prisma.lenderOrg.findFirst({
    orderBy: { legalName: "asc" },
    select: { id: true },
    where: { status: "APPROVED" },
  });

  return org?.id ?? null;
}
