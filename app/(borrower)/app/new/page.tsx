import { StateStatus } from "@prisma/client";

import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { SectionHead } from "@/components/section-head";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import { prisma } from "@/lib/prisma";

type NewListingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewListingPage({
  searchParams,
}: NewListingPageProps) {
  const params = await searchParams;
  const rawState = Array.isArray(params.state) ? params.state[0] : params.state;
  const state = rawState?.toUpperCase();
  const stateRule = state
    ? await prisma.stateRule.findUnique({ where: { state } })
    : null;

  return (
    <>
      <NavBar />
      <main className="vr-section bg-bone">
        <div className="vr-frame max-w-3xl">
          {!state ? <StatePicker /> : null}
          {state && stateRule?.status === StateStatus.GREEN ? (
            <OpenState state={state} />
          ) : null}
          {state && stateRule?.status !== StateStatus.GREEN ? (
            <GatedState state={state} />
          ) : null}
        </div>
      </main>
      <FooterDisclosures />
    </>
  );
}

function StatePicker() {
  return (
    <div>
      <SectionHead
        sub="Choose the property state. Launch status is checked before any listing can go live."
        title="Where is the property?"
      />
      <div className="flex flex-wrap gap-3">
        {["IL", "TX", "FL", "CA", "CO", "NY"].map((state) => (
          <Button
            href={`/app/new?state=${state}`}
            key={state}
            variant="secondary"
          >
            {state}
          </Button>
        ))}
      </div>
    </div>
  );
}

function OpenState({ state }: { state: string }) {
  return (
    <div className="vr-card p-6">
      <SectionHead
        sub="Prompt 3 will turn this entry point into the full listing wizard. For now, the state gate is open and ready."
        title={`VieRates is live in ${state}.`}
      />
      <Button href="/waitlist" variant="secondary">
        Save my spot anyway
      </Button>
    </div>
  );
}

function GatedState({ state }: { state: string }) {
  return (
    <div className="vr-card p-6" data-testid="gated-state">
      <SectionHead
        sub="Leave your email and we will tell you when anonymous listings open there."
        title={`VieRates isn't live in ${state} yet.`}
      />
      <WaitlistForm source={`gated-${state}`} />
    </div>
  );
}
