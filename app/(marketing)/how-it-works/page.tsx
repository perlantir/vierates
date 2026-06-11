import { SectionHead } from "@/components/section-head";
import { Button } from "@/components/ui/button";
import { SOFT_PULL_SENTENCE } from "@/lib/marketing/data";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  description:
    "See how VieRates lets borrowers list anonymously, open a verified Bid Room, and choose one lender to meet.",
  path: "/how-it-works",
  title: "How it works",
});

export default function HowItWorksPage() {
  return (
    <main>
      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead
            sub="You list once. Lenders compete silently. Your identity is shared only with the lender you choose."
            title="How VieRates works"
          />
          <div className="grid gap-6">
            {[
              [
                "1",
                "List anonymously",
                "Tell us the property state, loan purpose, rough value, loan amount, and timing. Checked against public records, then sealed. Lenders never see your street address.",
              ],
              [
                "2",
                "Open your Bid Room",
                `Verify once. ${SOFT_PULL_SENTENCE} Lenders see a masked profile and place firm bids for 48 hours.`,
              ],
              [
                "3",
                "Pick your winner",
                "You compare bids side by side. Your identity goes to that lender only. The other lenders never learn who you were.",
              ],
            ].map(([number, title, body], index) => (
              <article
                className="grid gap-5 border-t border-line py-6 md:grid-cols-[7rem_1fr]"
                key={title}
              >
                <p className="vr-data text-4xl font-semibold text-ink">
                  {number}
                </p>
                <div>
                  <h2 className="font-display text-3xl font-semibold text-ink">
                    {title}
                  </h2>
                  <p className="mt-3 max-w-3xl leading-7 text-text">{body}</p>
                  <StepMiniature step={index} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="vr-section bg-paper">
        <div className="vr-frame">
          <SectionHead title="What lenders see, and what stays hidden." />
          <AnonymityDiagram />
        </div>
      </section>
      <section className="bg-ink py-14 text-on-ink">
        <div className="vr-frame flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-4xl font-semibold">
              Ready to list anonymously?
            </h2>
            <p className="mt-3 text-on-ink-dim">{SOFT_PULL_SENTENCE}</p>
          </div>
          <Button href="/app/new" size="lg">
            Start my listing
          </Button>
        </div>
      </section>
    </main>
  );
}

function AnonymityDiagram() {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
      <ProfileCard title="Your private details">
        {["Name", "Phone", "Street address"].map((label, index) => (
          <p className="flex items-center justify-between gap-4" key={label}>
            <span>{label}</span>
            <span
              className="vr-redaction"
              style={{ width: `${62 + index * 12}%` }}
            />
          </p>
        ))}
      </ProfileCard>
      <ArrowLabel label="Hidden" />
      <ProfileCard title="Bid Room profile">
        {["State and county", "Loan amount", "LTV band", "Credit band"].map(
          (label) => (
            <p className="vr-data text-sm text-ink" key={label}>
              {label}
            </p>
          ),
        )}
      </ProfileCard>
      <ArrowLabel label="Reveal" />
      <ProfileCard title="One chosen lender">
        <p className="text-sm leading-6 text-text">
          Receives identity only after your consent record is written.
        </p>
      </ProfileCard>
    </div>
  );
}

function StepMiniature({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="mt-5 grid max-w-xl gap-2 rounded-card border border-line bg-card p-3 sm:grid-cols-2">
        {[
          "Lower my payment",
          "Get cash out",
          "Pay off faster",
          "Just see bids",
        ].map((label) => (
          <span
            className="rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="mt-5 max-w-xl rounded-card border border-line bg-card p-3">
        <div className="mb-3 h-1.5 rounded-full bg-line">
          <div className="h-full w-2/3 rounded-full bg-verified" />
        </div>
        {["Credit band", "LTV band", "Income verified"].map((label) => (
          <span className="vr-band-chip mb-2 mr-2 bg-paper" key={label}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 max-w-xl rounded-card border border-line bg-card p-3">
      {["Paddle #1", "Paddle #2", "Paddle #3"].map((label, index) => (
        <div
          className="grid grid-cols-[1fr_auto] border-t border-line py-2 text-sm first:border-t-0"
          key={label}
        >
          <span>{label}</span>
          <span className="vr-data font-semibold text-ink">
            {["6.08% APR", "6.21% APR", "6.49% APR"][index]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProfileCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="vr-card min-h-48 p-5">
      <h3 className="mb-4 font-display text-2xl font-semibold text-ink">
        {title}
      </h3>
      <div className="grid gap-3 text-sm text-text-muted">{children}</div>
    </div>
  );
}

function ArrowLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-text-muted md:flex-col">
      <span className="h-px w-12 bg-line-strong md:h-12 md:w-px" />
      <span>{label}</span>
    </div>
  );
}
