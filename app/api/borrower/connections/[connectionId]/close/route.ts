import { NextResponse } from "next/server";

import {
  closeBorrowerConnection,
  ConnectFlowError,
} from "@/lib/borrower/connect";
import { getCurrentBorrowerUserId } from "@/lib/borrower/current";
import { enforceRateLimit } from "@/lib/http/request-guards";
import { prisma } from "@/lib/prisma";

type CloseRouteContext = {
  params: Promise<{ connectionId: string }>;
};

export async function POST(_request: Request, context: CloseRouteContext) {
  const borrowerUserId = await getCurrentBorrowerUserId();
  const { connectionId } = await context.params;

  if (!borrowerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(_request, {
    key: borrowerUserId,
    limit: 60,
    prefix: "borrower:connections-close",
    window: "1 h",
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const connection = await closeBorrowerConnection(prisma, {
      borrowerUserId,
      connectionId,
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
      { error: "Connection could not be closed" },
      { status: 500 },
    );
  }
}
