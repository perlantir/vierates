import { PrismaClient, Role } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { lenderListingSelect } from "../../lib/dal/listings";
import { getLenderPortalData } from "../../lib/lender/portal";
import { authorizePusherChannel } from "../../lib/services/auction";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();
const piiPattern =
  /borrowerIdentity|firstName|lastName|email|phone|phoneVerifiedAt|streetAddress|street address/i;

describe("security: anonymity boundary fuzz", () => {
  it("keeps lender DAL projections free of identity fields", () => {
    expect(JSON.stringify(lenderListingSelect)).not.toMatch(piiPattern);
  });

  it("keeps lender board payloads free of borrower identity fields", async () => {
    const org = await prisma.lenderOrg.findFirstOrThrow({
      where: { status: "APPROVED" },
    });
    const data = await getLenderPortalData(org.id);

    expect(JSON.stringify(data.auctions)).not.toMatch(piiPattern);
  });

  it("rejects cross-subscription to borrower realtime channels", () => {
    expect(
      authorizePusherChannel({
        channelName: "private-borrower-listing_a",
        listingId: "listing_b",
        role: Role.BORROWER,
      }),
    ).toBe(false);
  });

  it("does not persist street address on Listing schema", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const listingModel = schema.slice(
      schema.indexOf("model Listing"),
      schema.indexOf("model VerificationBundle"),
    );

    expect(listingModel).not.toMatch(/street|address/i);
  });
});
