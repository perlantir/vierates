DELETE FROM "Rating"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "lenderOrgId", "listingId"
        ORDER BY "createdAt", "id"
      ) AS duplicate_rank
    FROM "Rating"
  ) ranked
  WHERE duplicate_rank > 1
);

DELETE FROM "DisputeCase"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "lenderOrgId", "listingId", "type"
        ORDER BY "createdAt", "id"
      ) AS duplicate_rank
    FROM "DisputeCase"
  ) ranked
  WHERE duplicate_rank > 1
);

CREATE UNIQUE INDEX "Rating_lenderOrgId_listingId_key" ON "Rating"("lenderOrgId", "listingId");
CREATE UNIQUE INDEX "DisputeCase_lenderOrgId_listingId_type_key" ON "DisputeCase"("lenderOrgId", "listingId", "type");
