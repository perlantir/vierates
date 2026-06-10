import { ConsentType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sha256 } from "@/lib/consent/records";
import { consentTextForParty } from "@/lib/consent/text";
import { prisma } from "@/lib/prisma";

const applicationSchema = z.object({
  consentTextShown: z.string().min(1),
  contactName: z.string().min(2),
  email: z.string().email(),
  nmlsId: z.string().regex(/^\d{4,10}$/),
  organizationName: z.string().min(2),
  phone: z.string().min(10),
  states: z.array(z.string().length(2)).min(1),
  textShownSha256: z.string().length(64),
});

export async function POST(request: Request) {
  const parsed = applicationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application" }, { status: 400 });
  }

  const input = parsed.data;
  const consentText = consentTextForParty("VieRates");
  const textShownSha256 = sha256(consentText);

  if (
    input.consentTextShown !== consentText ||
    input.textShownSha256 !== textShownSha256
  ) {
    return NextResponse.json(
      { error: "Consent text mismatch" },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const email = input.email.toLowerCase();

  const application = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { clerkId: `lender-application:${email}` },
      update: { role: Role.LENDER },
      create: {
        clerkId: `lender-application:${email}`,
        role: Role.LENDER,
      },
    });

    const consentRecord = await tx.consentRecord.create({
      data: {
        ip,
        textShownSha256,
        type: ConsentType.TCPA_CONNECT,
        userAgent,
        userId: user.id,
      },
    });

    return tx.lenderApplication.create({
      data: {
        consentRecordId: consentRecord.id,
        contactName: input.contactName,
        email,
        nmlsId: input.nmlsId,
        organizationName: input.organizationName,
        phone: input.phone,
        states: input.states,
      },
    });
  });

  return NextResponse.json({ id: application.id, ok: true });
}
