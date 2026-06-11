ALTER TABLE "BorrowerIdentity" ADD COLUMN "phoneHash" TEXT;

UPDATE "BorrowerIdentity"
SET
    "firstName" = 'legacy-redacted',
    "lastName" = 'legacy-redacted',
    "email" = 'legacy-redacted',
    "phone" = 'legacy-redacted',
    "phoneHash" = 'legacy:' || "id"
WHERE "phoneHash" IS NULL;

ALTER TABLE "BorrowerIdentity" ALTER COLUMN "phoneHash" SET NOT NULL;

CREATE UNIQUE INDEX "BorrowerIdentity_phoneHash_key" ON "BorrowerIdentity"("phoneHash");
