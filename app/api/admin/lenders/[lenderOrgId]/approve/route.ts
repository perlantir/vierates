import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type ApproveContext = {
  params: Promise<{ lenderOrgId: string }>;
};

export async function POST(_request: Request, context: ApproveContext) {
  const { lenderOrgId } = await context.params;
  const org = await prisma.lenderOrg.update({
    data: { status: "APPROVED" },
    where: { id: lenderOrgId },
  });

  await prisma.auditLog.create({
    data: {
      action: "admin.lender_approved",
      entity: "LenderOrg",
      entityId: lenderOrgId,
      meta: { nmlsId: org.nmlsId },
    },
  });

  return NextResponse.json({ ok: true, status: org.status });
}
