import { SectionHead } from "@/components/section-head";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "The VieRates story: a sealed-ledger marketplace built so borrowers can shop mortgage offers without becoming a lead.",
  path: "/about",
  title: "About",
});

export default function AboutPage() {
  return (
    <main className="vr-section bg-paper">
      <div className="vr-frame">
        <SectionHead
          sub="VieRates exists because borrowers should not have to trade privacy for pricing."
          title="A marketplace built around borrower control"
        />
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <aside className="vr-card p-5">
            <div className="grid h-48 place-items-center rounded-card border border-line bg-ink text-on-ink">
              <div className="text-center">
                <p className="vr-data text-sm text-on-ink-dim">
                  Borrower-first marketplace
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  Built around sealed identity
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-text-muted">
              For founder background, lender partnerships, or press inquiries,
              contact hello@vierates.com.
            </p>
          </aside>
          <div className="vr-legal grid gap-5">
            <p>
              Mortgage shopping has trained borrowers to expect a trade: give up
              your phone number, then brace for calls. VieRates flips that
              order. You list anonymously, lenders compete silently, and you
              choose whether one lender gets to meet you.
            </p>
            <p>
              The idea became urgent after the lead-generation trigger-ban era:
              borrowers still need a way to create lender competition, but the
              old internet-lead model made privacy feel like the price of
              comparison shopping.
            </p>
            <p>
              VieRates is a marketplace. It does not make loans, take loan
              applications, or make credit decisions. Participating lenders make
              those decisions, and the borrower controls the reveal.
            </p>
            <p>
              For partnership, lender, or privacy questions, contact
              hello@vierates.com.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
