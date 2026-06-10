-- CreateTable
CREATE TABLE "LenderInvite" (
    "id" TEXT NOT NULL,
    "lenderOrgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LenderInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LenderInvite_lenderOrgId_idx" ON "LenderInvite"("lenderOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "LenderInvite_lenderOrgId_email_key" ON "LenderInvite"("lenderOrgId", "email");

-- AddForeignKey
ALTER TABLE "LenderInvite" ADD CONSTRAINT "LenderInvite_lenderOrgId_fkey" FOREIGN KEY ("lenderOrgId") REFERENCES "LenderOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;
