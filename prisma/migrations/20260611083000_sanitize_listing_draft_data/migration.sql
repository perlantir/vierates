UPDATE "ListingDraft"
SET "data" = "data" - 'phone' - 'email' - 'address' - 'challengeId'
WHERE "data" ?| ARRAY['phone', 'email', 'address', 'challengeId'];
