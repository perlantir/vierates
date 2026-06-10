-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BORROWER', 'LENDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'LIVE', 'IN_AUCTION', 'MATCHED', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('SCHEDULED', 'OPEN', 'CLOSED', 'REVEALED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('ACTIVE', 'IMPROVED', 'WITHDRAWN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TCPA_CONNECT', 'TCPA_REVEAL', 'CREDIT_SOFT_PULL', 'HPPA_OPTIN', 'ESIGN', 'SMS_OPTIN');

-- CreateEnum
CREATE TYPE "StateStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowerIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "BorrowerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "borrowerUserId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "purpose" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "occupancy" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "county" TEXT,
    "estValueBand" TEXT NOT NULL,
    "loanAmount" INTEGER NOT NULL,
    "ltvBand" TEXT NOT NULL,
    "currentRateBand" TEXT,
    "creditBandStated" TEXT NOT NULL,
    "incomeBandStated" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "propertyMatchOk" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationBundle" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "creditBandVerified" TEXT,
    "scoreModel" TEXT,
    "dtiBand" TEXT,
    "incomeVerifiedAt" TIMESTAMP(3),
    "vendorRefs" JSONB NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "VerificationBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LenderOrg" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "dba" TEXT,
    "nmlsId" TEXT NOT NULL,
    "statesLicensed" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "LenderOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LenderUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "orgRole" TEXT NOT NULL,
    "nmlsIndividualId" TEXT,

    CONSTRAINT "LenderUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageBox" (
    "id" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "states" TEXT[],
    "ficoMin" INTEGER NOT NULL,
    "ltvMaxBp" INTEGER NOT NULL,
    "products" TEXT[],
    "purposes" TEXT[],
    "loanMin" INTEGER NOT NULL,
    "loanMax" INTEGER NOT NULL,

    CONSTRAINT "CoverageBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "pickDeadline" TIMESTAMP(3),
    "bestAprBp" INTEGER,
    "bidCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "lenderUserId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "rateBp" INTEGER NOT NULL,
    "points" DECIMAL(65,30) NOT NULL,
    "lenderFees" JSONB NOT NULL,
    "aprBp" INTEGER NOT NULL,
    "lockDays" INTEGER NOT NULL,
    "conditions" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditTxnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "consentRecordId" TEXT NOT NULL,
    "creditTxnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "grantedToLenderOrgId" TEXT,
    "textShownSha256" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "trustedFormCertUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityGrant" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "consentRecordId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditWallet" (
    "id" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "plan" TEXT NOT NULL,

    CONSTRAINT "CreditWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refId" TEXT,
    "stripeRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeCase" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateRule" (
    "state" TEXT NOT NULL,
    "status" "StateStatus" NOT NULL DEFAULT 'YELLOW',
    "notes" TEXT,

    CONSTRAINT "StateRule_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowerIdentity_userId_key" ON "BorrowerIdentity"("userId");

-- CreateIndex
CREATE INDEX "Listing_borrowerUserId_idx" ON "Listing"("borrowerUserId");

-- CreateIndex
CREATE INDEX "Listing_state_status_idx" ON "Listing"("state", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationBundle_listingId_key" ON "VerificationBundle"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "LenderOrg_nmlsId_key" ON "LenderOrg"("nmlsId");

-- CreateIndex
CREATE UNIQUE INDEX "LenderUser_userId_key" ON "LenderUser"("userId");

-- CreateIndex
CREATE INDEX "LenderUser_lenderOrgId_idx" ON "LenderUser"("lenderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageBox_lenderOrgId_key" ON "CoverageBox"("lenderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_listingId_key" ON "Auction"("listingId");

-- CreateIndex
CREATE INDEX "Bid_lenderUserId_idx" ON "Bid"("lenderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_auctionId_lenderOrgId_status_key" ON "Bid"("auctionId", "lenderOrgId", "status");

-- CreateIndex
CREATE INDEX "Connection_listingId_idx" ON "Connection"("listingId");

-- CreateIndex
CREATE INDEX "Connection_lenderOrgId_idx" ON "Connection"("lenderOrgId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_grantedToLenderOrgId_idx" ON "ConsentRecord"("grantedToLenderOrgId");

-- CreateIndex
CREATE INDEX "IdentityGrant_lenderOrgId_idx" ON "IdentityGrant"("lenderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityGrant_listingId_lenderOrgId_key" ON "IdentityGrant"("listingId", "lenderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditWallet_lenderOrgId_key" ON "CreditWallet"("lenderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_idempotencyKey_key" ON "CreditTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CreditTransaction_walletId_idx" ON "CreditTransaction"("walletId");

-- CreateIndex
CREATE INDEX "Rating_lenderOrgId_idx" ON "Rating"("lenderOrgId");

-- CreateIndex
CREATE INDEX "Rating_listingId_idx" ON "Rating"("listingId");

-- CreateIndex
CREATE INDEX "DisputeCase_listingId_idx" ON "DisputeCase"("listingId");

-- CreateIndex
CREATE INDEX "DisputeCase_lenderOrgId_idx" ON "DisputeCase"("lenderOrgId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- AddForeignKey
ALTER TABLE "BorrowerIdentity" ADD CONSTRAINT "BorrowerIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_borrowerUserId_fkey" FOREIGN KEY ("borrowerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationBundle" ADD CONSTRAINT "VerificationBundle_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LenderUser" ADD CONSTRAINT "LenderUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LenderUser" ADD CONSTRAINT "LenderUser_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageBox" ADD CONSTRAINT "CoverageBox_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lenderUserId_fkey" FOREIGN KEY ("lenderUserId") REFERENCES "LenderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_creditTxnId_fkey" FOREIGN KEY ("creditTxnId") REFERENCES "CreditTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_creditTxnId_fkey" FOREIGN KEY ("creditTxnId") REFERENCES "CreditTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_grantedToLenderOrgId_fkey" FOREIGN KEY ("grantedToLenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityGrant" ADD CONSTRAINT "IdentityGrant_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityGrant" ADD CONSTRAINT "IdentityGrant_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityGrant" ADD CONSTRAINT "IdentityGrant_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditWallet" ADD CONSTRAINT "CreditWallet_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CreditWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
