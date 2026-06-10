import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import {
  ConnectFlowError,
  requestLenderConnection,
} from "@/lib/borrower/connect";
import { prisma } from "@/lib/prisma";

const connectionSchema = z.object({
  consentTextShown: z.string().min(1),
  idempotencyKey: z.string().min(8),
  lenderOrgId: z.string().min(1),
  listingId: z.string().min(1),
  textShownSha256: z.string().length(64),
  trustedFormCertUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const parsed = connectionSchema.safeParse(await request.json());

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection" }, { status: 400 });
  }

  try {
    const connection = await requestLenderConnection(prisma, {
      borrowerUserId,
      consentTextShown: parsed.data.consentTextShown,
      idempotencyKey: parsed.data.idempotencyKey,
      ip: requestIp(request),
      lenderOrgId: parsed.data.lenderOrgId,
      listingId: parsed.data.listingId,
      textShownSha256: parsed.data.textShownSha256,
      trustedFormCertUrl: parsed.data.trustedFormCertUrl,
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({
      id: connection.id,
      ok: true,
      status: connection.status,
    });
  } catch (error) {
    if (error instanceof ConnectFlowError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Connection could not be created" },
      { status: 500 },
    );
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
