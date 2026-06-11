import { ConsentType, PrismaClient } from "@prisma/client";

import { sha256 } from "@/lib/consent/records";
import { consentTextForParty } from "@/lib/consent/text";
import { prisma } from "@/lib/prisma";

const activeConnectionStatuses = ["REQUESTED", "DELIVERED", "CONTACTED"];

export type ConnectDirectoryData = Awaited<
  ReturnType<typeof getConnectDirectoryData>
>;

export class ConnectFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export async function getConnectDirectoryData(borrowerUserId: string) {
  const [listing, lenders] = await Promise.all([
    prisma.listing.findFirst({
      include: {
        connections: {
          include: {
            lenderOrg: {
              select: {
                dba: true,
                legalName: true,
                nmlsId: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      where: {
        borrowerUserId,
        deletedAt: null,
      },
    }),
    prisma.lenderOrg.findMany({
      include: {
        coverageBox: true,
        ratings: {
          select: { stars: true },
        },
      },
      orderBy: { legalName: "asc" },
      where: { status: "APPROVED" },
    }),
  ]);

  return { lenders, listing };
}

export async function requestLenderConnection(
  db: PrismaClient,
  input: {
    borrowerUserId: string;
    consentTextShown: string;
    idempotencyKey: string;
    ip: string;
    lenderOrgId: string;
    listingId: string;
    textShownSha256: string;
    trustedFormCertUrl?: string;
    userAgent: string;
  },
) {
  return db.$transaction(async (tx) => {
    const existingTxn = await tx.creditTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existingTxn) {
      const existingConnection = await tx.connection.findFirst({
        where: {
          creditTxnId: existingTxn.id,
          listing: {
            borrowerUserId: input.borrowerUserId,
          },
        },
      });

      if (existingConnection) {
        return existingConnection;
      }

      throw new ConnectFlowError(
        "Duplicate connection idempotency key.",
        "IDEMPOTENCY_CONFLICT",
        409,
      );
    }

    const listing = await tx.listing.findFirst({
      where: {
        borrowerUserId: input.borrowerUserId,
        deletedAt: null,
        id: input.listingId,
      },
    });

    if (!listing) {
      throw new ConnectFlowError(
        "Listing not found.",
        "LISTING_NOT_FOUND",
        404,
      );
    }

    const activeConnection = await tx.connection.findFirst({
      where: {
        listingId: listing.id,
        status: { in: activeConnectionStatuses },
      },
    });

    if (activeConnection) {
      throw new ConnectFlowError(
        "Close your active introduction before picking another lender.",
        "ACTIVE_CONNECTION_EXISTS",
        409,
      );
    }

    const lender = await tx.lenderOrg.findFirst({
      include: { wallet: true },
      where: {
        id: input.lenderOrgId,
        status: "APPROVED",
      },
    });

    if (!lender?.wallet) {
      throw new ConnectFlowError(
        "Lender is not available.",
        "LENDER_UNAVAILABLE",
        404,
      );
    }

    const expectedConsentText = consentTextForParty(lender.legalName);
    const expectedHash = sha256(expectedConsentText);

    if (
      input.consentTextShown !== expectedConsentText ||
      input.textShownSha256 !== expectedHash
    ) {
      throw new ConnectFlowError(
        "Consent text mismatch.",
        "CONSENT_TEXT_MISMATCH",
        400,
      );
    }

    const walletDebit = await tx.creditWallet.updateMany({
      data: { balance: { decrement: 1 } },
      where: {
        balance: { gte: 1 },
        id: lender.wallet.id,
      },
    });

    if (walletDebit.count !== 1) {
      throw new ConnectFlowError(
        "Lender wallet has no credits.",
        "NO_CREDITS",
        409,
      );
    }

    const consentRecord = await tx.consentRecord.create({
      data: {
        grantedToLenderOrgId: lender.id,
        ip: input.ip,
        textShownSha256: expectedHash,
        trustedFormCertUrl: input.trustedFormCertUrl,
        type: ConsentType.TCPA_CONNECT,
        userAgent: input.userAgent,
        userId: input.borrowerUserId,
      },
    });

    const creditTxn = await tx.creditTransaction.create({
      data: {
        delta: -1,
        idempotencyKey: input.idempotencyKey,
        reason: "CONNECTION",
        refId: `${listing.id}:${lender.id}`,
        walletId: lender.wallet.id,
      },
    });

    const connection = await tx.connection.create({
      data: {
        consentRecordId: consentRecord.id,
        creditTxnId: creditTxn.id,
        lenderOrgId: lender.id,
        listingId: listing.id,
        status: "DELIVERED",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "borrower.connection_delivered",
        actorUserId: input.borrowerUserId,
        entity: "Connection",
        entityId: connection.id,
        ip: input.ip,
        meta: {
          lenderOrgId: lender.id,
          listingId: listing.id,
          notified: true,
        },
      },
    });

    return connection;
  });
}

export async function closeBorrowerConnection(
  db: PrismaClient,
  input: { borrowerUserId: string; connectionId: string },
) {
  const connection = await db.connection.findFirst({
    select: { id: true },
    where: {
      id: input.connectionId,
      listing: {
        borrowerUserId: input.borrowerUserId,
      },
      status: { in: activeConnectionStatuses },
    },
  });

  if (!connection) {
    throw new ConnectFlowError(
      "Connection not found.",
      "CONNECTION_NOT_FOUND",
      404,
    );
  }

  return db.connection.update({
    data: { status: "CLOSED" },
    where: { id: connection.id },
  });
}
