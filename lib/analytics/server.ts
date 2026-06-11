import type { Prisma, PrismaClient } from "@prisma/client";

import type { FunnelEventName } from "@/lib/analytics/events";

type FunnelEventDb = PrismaClient | Prisma.TransactionClient;

export async function recordFunnelEvent(
  db: FunnelEventDb,
  input: {
    event: FunnelEventName;
    metadata?: Prisma.InputJsonValue;
    sessionId: string;
    step: string;
    userId?: string;
  },
) {
  return db.funnelEvent.create({
    data: {
      event: input.event,
      metadata: input.metadata ?? {},
      sessionId: input.sessionId,
      step: input.step,
      userId: input.userId,
    },
  });
}
