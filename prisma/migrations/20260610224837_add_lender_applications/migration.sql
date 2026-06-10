-- CreateTable
CREATE TABLE "LenderApplication" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "nmlsId" TEXT NOT NULL,
    "states" TEXT[],
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "consentRecordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LenderApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LenderApplication_nmlsId_idx" ON "LenderApplication"("nmlsId");

-- CreateIndex
CREATE INDEX "LenderApplication_email_idx" ON "LenderApplication"("email");

-- AddForeignKey
ALTER TABLE "LenderApplication" ADD CONSTRAINT "LenderApplication_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
