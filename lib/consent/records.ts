import { createHash } from "node:crypto";
import type { ConsentType, Prisma } from "@prisma/client";

export type ConsentWrite = {
  userId: string;
  type: ConsentType;
  textShown: string;
  ip: string;
  userAgent: string;
  grantedToLenderOrgId?: string;
  trustedFormCertUrl?: string;
};

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createConsentRecord(
  db: Prisma.TransactionClient,
  input: ConsentWrite,
) {
  return db.consentRecord.create({
    data: {
      userId: input.userId,
      type: input.type,
      grantedToLenderOrgId: input.grantedToLenderOrgId,
      textShownSha256: sha256(input.textShown),
      ip: input.ip,
      userAgent: input.userAgent,
      trustedFormCertUrl: input.trustedFormCertUrl,
    },
  });
}
