import { ListingStatus, Prisma, PrismaClient, Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  borrowerIdentityVaultData,
  borrowerPhoneHash,
  decryptBorrowerIdentityField,
  encryptBorrowerIdentityField,
} from "../../lib/security/borrower-identity-vault";
import { deleteBorrowerListingAndVault } from "../../lib/borrower/dashboard";
import { setValidTestEnv } from "../helpers/env";

setValidTestEnv();

const prisma = new PrismaClient();

describe("security: borrower identity vault", () => {
  it("stores borrower identity fields encrypted with a phone blind index", async () => {
    const suffix = `${Date.now()}${Math.random().toString(16).slice(2)}`;
    const plaintext = {
      email: `vault-${suffix}@borrower.vierates.local`,
      firstName: "Vault",
      lastName: "Borrower",
      phone: `312556${suffix.slice(-4).padStart(4, "0")}`,
    };
    const user = await prisma.user.create({
      data: {
        clerkId: `security-vault:${suffix}`,
        role: Role.BORROWER,
      },
    });

    const identity = await prisma.borrowerIdentity.create({
      data: {
        ...borrowerIdentityVaultData(plaintext),
        userId: user.id,
      },
    });
    const rawRows = await prisma.$queryRaw<
      Array<{
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        phoneHash: string;
      }>
    >(Prisma.sql`
      SELECT "email", "firstName", "lastName", "phone", "phoneHash"
      FROM "BorrowerIdentity"
      WHERE "id" = ${identity.id}
    `);
    const raw = rawRows[0];

    expect(raw).toBeTruthy();
    expect(raw.email).not.toBe(plaintext.email);
    expect(raw.firstName).not.toBe(plaintext.firstName);
    expect(raw.lastName).not.toBe(plaintext.lastName);
    expect(raw.phone).not.toBe(plaintext.phone);
    expect(raw.email).toMatch(/^v1:/);
    expect(raw.phone).toMatch(/^v1:/);
    expect(raw.phoneHash).toBe(borrowerPhoneHash(plaintext.phone));
    expect(raw.phoneHash).toHaveLength(64);
    expect(decryptBorrowerIdentityField("email", identity.emailEncrypted)).toBe(
      plaintext.email,
    );
    expect(
      await prisma.borrowerIdentity.findUnique({
        where: { phoneHash: borrowerPhoneHash(plaintext.phone) },
      }),
    ).toMatchObject({ id: identity.id });
  });

  it("deletes identity vault and OTP residue on borrower deletion", async () => {
    const suffix = `${Date.now()}${Math.random().toString(16).slice(2)}`;
    const phone = `312557${suffix.slice(-4).padStart(4, "0")}`;
    const user = await prisma.user.create({
      data: {
        clerkId: `security-vault-delete:${suffix}`,
        role: Role.BORROWER,
      },
    });
    await prisma.borrowerIdentity.create({
      data: {
        ...borrowerIdentityVaultData({
          email: `delete-${suffix}@borrower.vierates.local`,
          firstName: "Delete",
          lastName: "Borrower",
          phone,
        }),
        userId: user.id,
      },
    });
    const listing = await prisma.listing.create({
      data: {
        borrowerUserId: user.id,
        creditBandStated: "740_PLUS",
        estValueBand: "$500k-$550k",
        incomeBandStated: "200K_PLUS",
        loanAmount: 400000,
        ltvBand: "60-70",
        occupancy: "PRIMARY",
        propertyMatchOk: true,
        propertyType: "SINGLE_FAMILY",
        purpose: "REFINANCE",
        state: "IL",
        status: ListingStatus.LIVE,
        timeline: "ASAP",
      },
    });
    await prisma.otpChallenge.create({
      data: {
        codeHash: "x".repeat(64),
        expiresAt: new Date(Date.now() + 60_000),
        ip: "198.51.100.88",
        phone: encryptBorrowerIdentityField("phone", phone),
        phoneHash: borrowerPhoneHash(phone),
        status: "VERIFIED",
      },
    });

    await deleteBorrowerListingAndVault(prisma, {
      borrowerUserId: user.id,
      ip: "198.51.100.89",
      listingId: listing.id,
    });

    await expect(
      prisma.borrowerIdentity.findUnique({ where: { userId: user.id } }),
    ).resolves.toBeNull();
    await expect(
      prisma.otpChallenge.findFirst({
        where: { phoneHash: borrowerPhoneHash(phone) },
      }),
    ).resolves.toBeNull();
  });
});
