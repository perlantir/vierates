import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getLenderPortalData } from "../lib/lender/portal";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();

describe("lender board masking", () => {
  it("returns board payloads with zero borrower identity fields", async () => {
    const org = await prisma.lenderOrg.findFirstOrThrow({
      where: { status: "APPROVED" },
    });
    const data = await getLenderPortalData(org.id);
    const serialized = JSON.stringify(data.auctions);

    expect(serialized).not.toMatch(
      /borrowerIdentity|firstName|lastName|email|phone|phoneVerifiedAt/i,
    );
  });
});
