import { SectionHead } from "@/components/section-head";

export default function AboutPage() {
  return (
    <main className="vr-section bg-bone">
      <div className="vr-frame">
        <SectionHead
          sub="VieRates exists because borrowers should not have to trade privacy for pricing."
          title="A marketplace built around borrower control"
        />
        <div className="vr-legal grid gap-5">
          <p>
            The old mortgage shopping flow asked borrowers to fill out a form
            and wait for calls. VieRates flips the order. You list anonymously,
            lenders bid silently, and you choose whether to reveal your
            identity.
          </p>
          <p>
            VieRates is a marketplace. It does not make loans, take
            applications, or make credit decisions. Participating lenders make
            those decisions.
          </p>
          <p>
            The product is simple: bids, consent, and anonymity enforced in the
            data layer.
          </p>
        </div>
      </div>
    </main>
  );
}
