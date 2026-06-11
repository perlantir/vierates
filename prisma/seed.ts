import {
  Prisma,
  PrismaClient,
  Role,
  ListingStatus,
  AuctionStatus,
  BidStatus,
  StateStatus,
} from "@prisma/client";

import { borrowerIdentityVaultData } from "../lib/security/borrower-identity-vault";

const prisma = new PrismaClient();

const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

const greenStates = new Set(["CA", "CO", "FL", "IL", "TX"]);

const lenderOrgs = [
  {
    id: "seed_lender_org_1",
    legalName: "Prairie Home Lending LLC",
    dba: "Prairie Home",
    nmlsId: "1000001",
    statesLicensed: ["IL", "TX", "CO"],
    ficoMin: 660,
    ltvMaxBp: 8500,
    loanMin: 150000,
    loanMax: 900000,
  },
  {
    id: "seed_lender_org_2",
    legalName: "Coastal Mutual Mortgage Inc",
    dba: "Coastal Mutual",
    nmlsId: "1000002",
    statesLicensed: ["CA", "FL", "IL"],
    ficoMin: 700,
    ltvMaxBp: 8000,
    loanMin: 200000,
    loanMax: 1250000,
  },
  {
    id: "seed_lender_org_3",
    legalName: "Summit Rate Cooperative",
    dba: "Summit Rate",
    nmlsId: "1000003",
    statesLicensed: ["CO", "TX", "FL"],
    ficoMin: 640,
    ltvMaxBp: 9000,
    loanMin: 100000,
    loanMax: 750000,
  },
] as const;

const listingStates = [
  "IL",
  "TX",
  "FL",
  "CA",
  "CO",
  "IL",
  "TX",
  "FL",
  "CA",
  "CO",
];

async function main() {
  await seedStateRules();
  await seedAdmin();
  await seedLenders();
  await seedListings();
  await seedAuctionsAndBids();
}

async function seedStateRules() {
  await Promise.all(
    states.map((state) =>
      prisma.stateRule.upsert({
        where: { state },
        update: {
          status: greenStates.has(state)
            ? StateStatus.GREEN
            : StateStatus.YELLOW,
          notes: greenStates.has(state)
            ? "Seed launch state for local development."
            : "Seed default pending review.",
        },
        create: {
          state,
          status: greenStates.has(state)
            ? StateStatus.GREEN
            : StateStatus.YELLOW,
          notes: greenStates.has(state)
            ? "Seed launch state for local development."
            : "Seed default pending review.",
        },
      }),
    ),
  );
}

async function seedAdmin() {
  await prisma.user.upsert({
    where: { clerkId: "seed_admin_clerk" },
    update: { role: Role.ADMIN },
    create: {
      id: "seed_admin_user",
      clerkId: "seed_admin_clerk",
      role: Role.ADMIN,
    },
  });
}

async function seedLenders() {
  for (const org of lenderOrgs) {
    const userId = `seed_lender_user_${org.id.slice(-1)}`;
    const walletId = `seed_wallet_${org.id.slice(-1)}`;

    await prisma.user.upsert({
      where: { clerkId: `${userId}_clerk` },
      update: { role: Role.LENDER },
      create: {
        id: userId,
        clerkId: `${userId}_clerk`,
        role: Role.LENDER,
      },
    });

    await prisma.lenderOrg.upsert({
      where: { nmlsId: org.nmlsId },
      update: {
        legalName: org.legalName,
        dba: org.dba,
        statesLicensed: [...org.statesLicensed],
        status: "APPROVED",
      },
      create: {
        id: org.id,
        legalName: org.legalName,
        dba: org.dba,
        nmlsId: org.nmlsId,
        statesLicensed: [...org.statesLicensed],
        status: "APPROVED",
      },
    });

    await prisma.lenderUser.upsert({
      where: { userId },
      update: {
        lenderOrgId: org.id,
        orgRole: "ORG_ADMIN",
        nmlsIndividualId: `${org.nmlsId}-LO1`,
      },
      create: {
        id: `seed_lender_profile_${org.id.slice(-1)}`,
        userId,
        lenderOrgId: org.id,
        orgRole: "ORG_ADMIN",
        nmlsIndividualId: `${org.nmlsId}-LO1`,
      },
    });

    await prisma.coverageBox.upsert({
      where: { lenderOrgId: org.id },
      update: {
        states: [...org.statesLicensed],
        ficoMin: org.ficoMin,
        ltvMaxBp: org.ltvMaxBp,
        products: ["30Y_FIXED", "20Y_FIXED", "15Y_FIXED"],
        purposes: ["REFINANCE", "CASH_OUT", "PURCHASE"],
        loanMin: org.loanMin,
        loanMax: org.loanMax,
      },
      create: {
        id: `seed_coverage_${org.id.slice(-1)}`,
        lenderOrgId: org.id,
        states: [...org.statesLicensed],
        ficoMin: org.ficoMin,
        ltvMaxBp: org.ltvMaxBp,
        products: ["30Y_FIXED", "20Y_FIXED", "15Y_FIXED"],
        purposes: ["REFINANCE", "CASH_OUT", "PURCHASE"],
        loanMin: org.loanMin,
        loanMax: org.loanMax,
      },
    });

    await prisma.creditWallet.upsert({
      where: { lenderOrgId: org.id },
      update: {
        balance: 120,
        plan: "PRO_DEMO",
      },
      create: {
        id: walletId,
        lenderOrgId: org.id,
        balance: 120,
        plan: "PRO_DEMO",
      },
    });

    await ensureCreditTransaction({
      id: `seed_credit_grant_${org.id.slice(-1)}`,
      walletId,
      delta: 120,
      reason: "SEED_GRANT",
      idempotencyKey: `seed:grant:${org.id}`,
    });
  }
}

async function seedListings() {
  for (let index = 0; index < 10; index += 1) {
    const listingNumber = index + 1;
    const borrowerUserId = `seed_borrower_user_${listingNumber}`;
    const listingId = `seed_listing_${listingNumber}`;
    const state = listingStates[index] ?? "IL";
    const loanAmount = 260000 + index * 25000;

    await prisma.user.upsert({
      where: { clerkId: `${borrowerUserId}_clerk` },
      update: { role: Role.BORROWER },
      create: {
        id: borrowerUserId,
        clerkId: `${borrowerUserId}_clerk`,
        role: Role.BORROWER,
      },
    });

    await prisma.borrowerIdentity.upsert({
      where: { userId: borrowerUserId },
      update: {
        ...borrowerIdentityVaultData({
          email: `demo.borrower.${listingNumber}@example.com`,
          firstName: `Demo${listingNumber}`,
          lastName: "Borrower",
          phone: `31255501${listingNumber.toString().padStart(2, "0")}`,
        }),
        phoneVerifiedAt: new Date("2026-06-10T12:00:00.000Z"),
      },
      create: {
        id: `seed_borrower_identity_${listingNumber}`,
        userId: borrowerUserId,
        ...borrowerIdentityVaultData({
          email: `demo.borrower.${listingNumber}@example.com`,
          firstName: `Demo${listingNumber}`,
          lastName: "Borrower",
          phone: `31255501${listingNumber.toString().padStart(2, "0")}`,
        }),
        phoneVerifiedAt: new Date("2026-06-10T12:00:00.000Z"),
      },
    });

    await prisma.listing.upsert({
      where: { id: listingId },
      update: {
        status:
          listingNumber <= 2 ? ListingStatus.IN_AUCTION : ListingStatus.LIVE,
        purpose: index % 3 === 0 ? "CASH_OUT" : "REFINANCE",
        propertyType: index % 2 === 0 ? "SINGLE_FAMILY" : "CONDO",
        occupancy: index % 4 === 0 ? "RENTAL" : "PRIMARY",
        state,
        county: countyForState(state),
        estValueBand: valueBand(index),
        loanAmount,
        ltvBand: index % 3 === 0 ? "70-80" : "60-70",
        currentRateBand: index % 2 === 0 ? "6.5-7" : "6-6.5",
        creditBandStated: index % 2 === 0 ? "700-739" : "740+",
        incomeBandStated: index % 2 === 0 ? "$150k-$200k" : "$200k+",
        timeline: index % 5 === 0 ? "JUST_WATCHING" : "ASAP",
        propertyMatchOk: true,
      },
      create: {
        id: listingId,
        borrowerUserId,
        status:
          listingNumber <= 2 ? ListingStatus.IN_AUCTION : ListingStatus.LIVE,
        purpose: index % 3 === 0 ? "CASH_OUT" : "REFINANCE",
        propertyType: index % 2 === 0 ? "SINGLE_FAMILY" : "CONDO",
        occupancy: index % 4 === 0 ? "RENTAL" : "PRIMARY",
        state,
        county: countyForState(state),
        estValueBand: valueBand(index),
        loanAmount,
        ltvBand: index % 3 === 0 ? "70-80" : "60-70",
        currentRateBand: index % 2 === 0 ? "6.5-7" : "6-6.5",
        creditBandStated: index % 2 === 0 ? "700-739" : "740+",
        incomeBandStated: index % 2 === 0 ? "$150k-$200k" : "$200k+",
        timeline: index % 5 === 0 ? "JUST_WATCHING" : "ASAP",
        propertyMatchOk: true,
      },
    });

    await prisma.verificationBundle.upsert({
      where: { listingId },
      update: {
        creditBandVerified: index % 2 === 0 ? "700-739" : "740+",
        scoreModel: "FICO_10T",
        dtiBand: index % 2 === 0 ? "30-35" : "25-30",
        incomeVerifiedAt: new Date("2026-06-10T12:00:00.000Z"),
        vendorRefs: {
          array: `seed_array_${listingNumber}`,
          truv: `seed_truv_${listingNumber}`,
        },
        status: "VERIFIED",
      },
      create: {
        id: `seed_verification_${listingNumber}`,
        listingId,
        creditBandVerified: index % 2 === 0 ? "700-739" : "740+",
        scoreModel: "FICO_10T",
        dtiBand: index % 2 === 0 ? "30-35" : "25-30",
        incomeVerifiedAt: new Date("2026-06-10T12:00:00.000Z"),
        vendorRefs: {
          array: `seed_array_${listingNumber}`,
          truv: `seed_truv_${listingNumber}`,
        },
        status: "VERIFIED",
      },
    });
  }
}

async function seedAuctionsAndBids() {
  const now = new Date("2026-06-10T15:00:00.000Z");

  for (const auctionNumber of [1, 2]) {
    const auctionId = `seed_auction_${auctionNumber}`;
    const listingId = `seed_listing_${auctionNumber}`;
    const bidCount = auctionNumber === 1 ? 3 : 4;

    await prisma.auction.upsert({
      where: { listingId },
      update: {
        status: AuctionStatus.OPEN,
        opensAt: now,
        closesAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        bestAprBp: auctionNumber === 1 ? 631 : 642,
        bidCount,
      },
      create: {
        id: auctionId,
        listingId,
        status: AuctionStatus.OPEN,
        opensAt: now,
        closesAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        bestAprBp: auctionNumber === 1 ? 631 : 642,
        bidCount,
      },
    });

    const bids = auctionNumber === 1 ? [0, 1, 2] : [0, 1, 2, 3];

    for (const bidIndex of bids) {
      const org = lenderOrgs[bidIndex % lenderOrgs.length];
      const lenderUserId = `seed_lender_profile_${org.id.slice(-1)}`;
      const walletId = `seed_wallet_${org.id.slice(-1)}`;
      const bidId = `seed_bid_${auctionNumber}_${bidIndex + 1}`;
      const status = bidIndex === 3 ? BidStatus.IMPROVED : BidStatus.ACTIVE;
      const rateBp = 598 + auctionNumber * 10 + bidIndex * 8;
      const aprBp = rateBp + 22 + bidIndex * 2;
      const creditTxnId = `seed_bid_credit_${auctionNumber}_${bidIndex + 1}`;

      await ensureCreditTransaction({
        id: creditTxnId,
        walletId,
        delta: -1,
        reason: "SEED_BID",
        refId: bidId,
        idempotencyKey: `seed:bid:${bidId}`,
      });

      await prisma.bid.upsert({
        where: {
          auctionId_lenderOrgId_status: {
            auctionId,
            lenderOrgId: org.id,
            status,
          },
        },
        update: {
          lenderUserId,
          product: "30Y_FIXED",
          program:
            bidIndex === 3 ? "Improved verified profile" : "Verified profile",
          rateBp,
          points: new Prisma.Decimal(bidIndex === 2 ? "0.250" : "0.000"),
          lenderFees: {
            underwriting: 995,
            processing: bidIndex === 1 ? 650 : 0,
          },
          aprBp,
          lockDays: 45,
          conditions:
            "Subject to appraisal and verified information remaining accurate.",
          creditTxnId,
        },
        create: {
          id: bidId,
          auctionId,
          lenderOrgId: org.id,
          lenderUserId,
          product: "30Y_FIXED",
          program:
            bidIndex === 3 ? "Improved verified profile" : "Verified profile",
          rateBp,
          points: new Prisma.Decimal(bidIndex === 2 ? "0.250" : "0.000"),
          lenderFees: {
            underwriting: 995,
            processing: bidIndex === 1 ? 650 : 0,
          },
          aprBp,
          lockDays: 45,
          conditions:
            "Subject to appraisal and verified information remaining accurate.",
          status,
          creditTxnId,
        },
      });
    }
  }
}

async function ensureCreditTransaction(input: {
  id: string;
  walletId: string;
  delta: number;
  reason: string;
  idempotencyKey: string;
  refId?: string;
  stripeRef?: string;
}) {
  const existing = await prisma.creditTransaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return prisma.creditTransaction.create({
    data: input,
  });
}

function countyForState(state: string): string {
  const counties: Record<string, string> = {
    CA: "Los Angeles",
    CO: "Denver",
    FL: "Orange",
    IL: "Cook",
    TX: "Travis",
  };

  return counties[state] ?? "Demo";
}

function valueBand(index: number): string {
  const lower = 350 + index * 50;
  return `$${lower}k-$${lower + 50}k`;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
