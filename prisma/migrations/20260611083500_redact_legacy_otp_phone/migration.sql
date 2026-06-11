UPDATE "OtpChallenge"
SET "phone" = 'legacy-redacted'
WHERE "phone" NOT LIKE 'v1:%';
