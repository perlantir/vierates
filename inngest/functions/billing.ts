import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { reconcileWallet } from "@/lib/services/billing";

export const billingReconcile = inngest.createFunction(
  { id: "billing-reconcile", triggers: [{ cron: "0 8 * * *" }] },
  async () => {
    const wallets = await prisma.creditWallet.findMany({
      select: { lenderOrgId: true },
    });
    const results = await Promise.all(
      wallets.map((wallet) => reconcileWallet(prisma, wallet.lenderOrgId)),
    );

    return {
      mismatches: results.filter((result) => !result.ok).length,
      wallets: results.length,
    };
  },
);
