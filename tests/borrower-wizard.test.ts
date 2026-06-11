import { ListingStatus, PrismaClient, Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import {
  BorrowerFlowError,
  startOtpChallenge,
  verifyOtpChallenge,
} from "../lib/borrower/wizard";
import { borrowerIdentityVaultData } from "../lib/security/borrower-identity-vault";
import { setValidTestEnv } from "./helpers/env";

setValidTestEnv();

const prisma = new PrismaClient();
const testPhones = ["3125559901", "3125559902", "3125559903", "3125559904"];

describe("borrower OTP abuse controls", () => {
  beforeEach(async () => {
    await prisma.otpChallenge.deleteMany({
      where: { phone: { in: testPhones } },
    });
    await prisma.user.deleteMany({
      where: {
        clerkId: {
          in: testPhones.map((phone) => `borrower-phone:${phone}`),
        },
      },
    });
  });

  it("blocks disposable or VoIP-looking numbers", async () => {
    await expect(
      startOtpChallenge(prisma, {
        ip: "198.51.100.10",
        phone: "5550001234",
      }),
    ).rejects.toMatchObject({
      code: "OTP_BLOCKED_PHONE",
    } satisfies Partial<BorrowerFlowError>);
  });

  it("rate limits repeated code starts per phone across IPs", async () => {
    for (let index = 0; index < 3; index += 1) {
      await startOtpChallenge(prisma, {
        ip: `198.51.100.${11 + index}`,
        phone: testPhones[0],
      });
    }

    await expect(
      startOtpChallenge(prisma, {
        ip: "198.51.100.99",
        phone: testPhones[0],
      }),
    ).rejects.toMatchObject({
      code: "OTP_RATE_LIMITED",
    } satisfies Partial<BorrowerFlowError>);
  });

  it("enforces one active listing per phone", async () => {
    const user = await prisma.user.create({
      data: {
        clerkId: `borrower-phone:${testPhones[1]}`,
        role: Role.BORROWER,
      },
    });

    await prisma.borrowerIdentity.create({
      data: {
        ...borrowerIdentityVaultData({
          email: `${testPhones[1]}@borrower.vierates.local`,
          firstName: "Anonymous",
          lastName: "Borrower",
          phone: testPhones[1],
        }),
        userId: user.id,
      },
    });

    await prisma.listing.create({
      data: {
        borrowerUserId: user.id,
        county: "Cook",
        creditBandStated: "700_739",
        estValueBand: "$500k-$550k",
        incomeBandStated: "150K_200K",
        loanAmount: 320000,
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

    await expect(
      startOtpChallenge(prisma, {
        ip: "198.51.100.12",
        phone: testPhones[1],
      }),
    ).rejects.toMatchObject({
      code: "OTP_ACTIVE_LISTING",
    } satisfies Partial<BorrowerFlowError>);
  });

  it("writes an SMS consent record when a code is verified", async () => {
    const challenge = await startOtpChallenge(prisma, {
      ip: "198.51.100.13",
      phone: testPhones[2],
    });

    const result = await verifyOtpChallenge(prisma, {
      challengeId: challenge.id,
      code: challenge.demoCode ?? "",
      ip: "198.51.100.13",
      userAgent: "vitest",
    });

    const consent = await prisma.consentRecord.findUnique({
      where: { id: result.consentRecordId },
    });

    expect(consent?.textShownSha256).toHaveLength(64);
    expect(consent?.type).toBe("SMS_OPTIN");
  });

  it("does not accept the former static demo OTP code", async () => {
    const challenge = await startOtpChallenge(prisma, {
      ip: "198.51.100.14",
      phone: "3125559904",
    });

    await expect(
      verifyOtpChallenge(prisma, {
        challengeId: challenge.id,
        code: "123456",
        ip: "198.51.100.14",
        userAgent: "vitest",
      }),
    ).rejects.toMatchObject({
      code: "OTP_CODE_MISMATCH",
    } satisfies Partial<BorrowerFlowError>);
  });
});
