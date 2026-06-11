ALTER TABLE "OtpChallenge" ADD COLUMN "phoneHash" TEXT;

UPDATE "OtpChallenge"
SET "phoneHash" = 'legacy:' || "id"
WHERE "phoneHash" IS NULL;

ALTER TABLE "OtpChallenge" ALTER COLUMN "phoneHash" SET NOT NULL;

DROP INDEX IF EXISTS "OtpChallenge_phone_status_idx";

CREATE INDEX "OtpChallenge_phoneHash_status_idx" ON "OtpChallenge"("phoneHash", "status");
