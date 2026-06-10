import type { Prisma } from "@prisma/client";

export type CreditLedgerWrite = {
  walletId: string;
  delta: number;
  reason: string;
  idempotencyKey: string;
  refId?: string;
  stripeRef?: string;
};

export async function appendCreditTransaction(
  db: Prisma.TransactionClient,
  input: CreditLedgerWrite,
) {
  return db.creditTransaction.create({
    data: {
      walletId: input.walletId,
      delta: input.delta,
      reason: input.reason,
      refId: input.refId,
      stripeRef: input.stripeRef,
      idempotencyKey: input.idempotencyKey,
    },
  });
}
