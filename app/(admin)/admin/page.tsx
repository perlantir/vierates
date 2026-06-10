import { AuctionStatus } from "@prisma/client";

import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [
    pendingLenders,
    stateRules,
    manualReviews,
    disputes,
    auditLogs,
    auctions,
  ] = await Promise.all([
    prisma.lenderOrg.findMany({
      orderBy: { legalName: "asc" },
      take: 10,
      where: { status: "PENDING" },
    }),
    prisma.stateRule.findMany({ orderBy: { state: "asc" } }),
    prisma.manualReviewCase.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      where: { status: "OPEN" },
    }),
    prisma.disputeCase.findMany({
      include: { lenderOrg: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.auction.findMany({
      include: { listing: true },
      orderBy: { opensAt: "desc" },
      take: 10,
      where: {
        status: {
          in: [
            AuctionStatus.SCHEDULED,
            AuctionStatus.OPEN,
            AuctionStatus.CLOSED,
          ],
        },
      },
    }),
  ]);

  return (
    <>
      <NavBar />
      <main className="vr-section min-h-screen bg-bone">
        <div className="vr-frame grid gap-6">
          <header className="border-b border-line pb-6">
            <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
              Admin console
            </h1>
            <p className="mt-3 max-w-2xl text-slate">
              Launch controls, lender approvals, manual review, disputes, audit
              logs, and live auctions.
            </p>
          </header>

          <section className="grid gap-4 lg:grid-cols-2">
            <AdminPanel title="Lender approval queue">
              {pendingLenders.map((org) => (
                <Row
                  key={org.id}
                  meta={`NMLS ${org.nmlsId}`}
                  title={org.legalName}
                />
              ))}
            </AdminPanel>
            <AdminPanel title="State launch editor">
              <div className="grid grid-cols-5 gap-2">
                {stateRules.slice(0, 25).map((rule) => (
                  <span
                    className="rounded-ui border border-line bg-paper px-2 py-1 text-center text-xs font-semibold text-slate"
                    key={rule.state}
                  >
                    {rule.state}: {rule.status}
                  </span>
                ))}
              </div>
            </AdminPanel>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <AdminPanel title="Manual review">
              {manualReviews.map((review) => (
                <Row
                  key={review.id}
                  meta={review.type}
                  title={review.summary}
                />
              ))}
            </AdminPanel>
            <AdminPanel title="Disputes">
              {disputes.map((dispute) => (
                <Row
                  key={dispute.id}
                  meta={`${dispute.lenderOrg.legalName} · ${dispute.status}`}
                  title={dispute.summary}
                />
              ))}
            </AdminPanel>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <AdminPanel title="Auction monitor">
              {auctions.map((auction) => (
                <Row
                  key={auction.id}
                  meta={`${auction.status} · ${auction.bidCount} bids`}
                  title={`${auction.listing.state} ${auction.listing.purpose}`}
                />
              ))}
            </AdminPanel>
            <AdminPanel title="Audit log">
              {auditLogs.map((log) => (
                <Row
                  key={log.id}
                  meta={log.entity}
                  title={`${log.action} · ${log.entityId}`}
                />
              ))}
            </AdminPanel>
          </section>
        </div>
      </main>
      <FooterDisclosures />
    </>
  );
}

function AdminPanel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="vr-card p-5">
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function Row({ meta, title }: { meta: string; title: string }) {
  return (
    <div className="border-b border-line pb-3 text-sm last:border-b-0">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-slate">{meta}</p>
    </div>
  );
}
