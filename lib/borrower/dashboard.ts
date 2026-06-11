import { ListingStatus, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  borrowerPhoneHash,
  decryptBorrowerIdentityField,
} from "@/lib/security/borrower-identity-vault";

export type BorrowerDashboardData = Awaited<
  ReturnType<typeof getBorrowerDashboardData>
>;

export async function getBorrowerDashboardData(borrowerUserId: string) {
  const listing = await prisma.listing.findFirst({
    include: {
      auction: {
        select: {
          bestAprBp: true,
          bidCount: true,
          closesAt: true,
          id: true,
          opensAt: true,
          status: true,
        },
      },
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
      verificationBundle: true,
    },
    orderBy: { createdAt: "desc" },
    where: {
      borrowerUserId,
      deletedAt: null,
    },
  });

  return { listing };
}

export async function setRateWatchFlag(
  db: PrismaClient,
  input: { borrowerUserId: string; enabled: boolean; listingId: string },
) {
  return db.listing.update({
    data: { rateWatchNurtureFlag: input.enabled },
    where: {
      id: input.listingId,
      borrowerUserId: input.borrowerUserId,
      deletedAt: null,
    },
  });
}

export async function deleteBorrowerListingAndVault(
  db: PrismaClient,
  input: { borrowerUserId: string; ip: string; listingId: string },
) {
  return db.$transaction(async (tx) => {
    const identity = await tx.borrowerIdentity.findUnique({
      select: { phoneEncrypted: true },
      where: { userId: input.borrowerUserId },
    });

    const listing = await tx.listing.update({
      data: {
        deletedAt: new Date(),
        status: ListingStatus.CLOSED,
      },
      where: {
        id: input.listingId,
        borrowerUserId: input.borrowerUserId,
        deletedAt: null,
      },
    });

    await tx.borrowerIdentity.deleteMany({
      where: { userId: input.borrowerUserId },
    });

    if (identity?.phoneEncrypted) {
      const phone = decryptBorrowerIdentityField(
        "phone",
        identity.phoneEncrypted,
      );

      await tx.listingDraft.deleteMany({
        where: {
          phone,
        },
      });
      await tx.otpChallenge.deleteMany({
        where: {
          phoneHash: borrowerPhoneHash(phone),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "borrower.delete_listing_and_vault",
        actorUserId: input.borrowerUserId,
        entity: "Listing",
        entityId: input.listingId,
        ip: input.ip,
        meta: {
          deletedAt: listing.deletedAt?.toISOString(),
          vaultDeleted: true,
        },
      },
    });

    return listing;
  });
}
