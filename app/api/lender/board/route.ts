import { NextResponse } from "next/server";

import { getCurrentLenderOrgId } from "@/lib/lender/current";
import { getLenderPortalData } from "@/lib/lender/portal";

export async function GET() {
  const lenderOrgId = await getCurrentLenderOrgId();

  if (!lenderOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getLenderPortalData(lenderOrgId);

  return NextResponse.json({ ok: true, ...data });
}
