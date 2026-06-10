import { PrismaClient } from "@prisma/client";

export const BILLING_REASONS = {
  BID: "BID",
  CONNECTION: "CONNECTION",
  GRANT: "GRANT",
  PACK: "PACK",
  SURCHARGE: "SURCHARGE",
} as const;

export class BillingServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export async function grantCredits(
  db: PrismaClient,
  input: {
    credits: number;
    idempotencyKey: string;
    lenderOrgId: string;
    reason: typeof BILLING_REASONS.GRANT | typeof BILLING_REASONS.PACK;
    stripeRef?: string;
  },
) {
  const existing = await db.creditTransaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return db.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.findUnique({
      where: { lenderOrgId: input.lenderOrgId },
    });

    if (!wallet) {
      throw new BillingServiceError(
        "Wallet not found.",
        "WALLET_NOT_FOUND",
        404,
      );
    }

    const transaction = await tx.creditTransaction.create({
      data: {
        delta: input.credits,
        idempotencyKey: input.idempotencyKey,
        reason: input.reason,
        stripeRef: input.stripeRef,
        walletId: wallet.id,
      },
    });

    await tx.creditWallet.update({
      data: { balance: { increment: input.credits } },
      where: { id: wallet.id },
    });

    return transaction;
  });
}

export async function reconcileWallet(
  db: PrismaClient,
  lenderOrgId: string,
): Promise<{ balance: number; expected: number; ok: boolean }> {
  const wallet = await db.creditWallet.findUnique({
    include: { transactions: true },
    where: { lenderOrgId },
  });

  if (!wallet) {
    throw new BillingServiceError("Wallet not found.", "WALLET_NOT_FOUND", 404);
  }

  const expected = wallet.transactions.reduce(
    (sum, transaction) => sum + transaction.delta,
    0,
  );

  return {
    balance: wallet.balance,
    expected,
    ok: wallet.balance === expected,
  };
}

export function verifyStripeWebhookSignature(
  signature: string | null,
): boolean {
  return Boolean(signature && signature.length > 8);
}
