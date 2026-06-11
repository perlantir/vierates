import { NextResponse } from "next/server";

import { getCurrentAdminUserId } from "@/lib/admin/current";
import { prisma } from "@/lib/prisma";

type ApproveContext = {
  params: Promise<{ lenderOrgId: string }>;
};

export async function POST(_request: Request, context: ApproveContext) {
  const adminUserId = await getCurrentAdminUserId();
  const { lenderOrgId } = await context.params;

  if (!adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await prisma.lenderOrg.update({
    data: { status: "APPROVED" },
    where: { id: lenderOrgId },
  });

  await prisma.auditLog.create({
    data: {
      action: "admin.lender_approved",
      actorUserId: adminUserId === "e2e-admin" ? undefined : adminUserId,
      entity: "LenderOrg",
      entityId: lenderOrgId,
      meta: { nmlsId: org.nmlsId },
    },
  });

  return NextResponse.json({ ok: true, status: org.status });
}
