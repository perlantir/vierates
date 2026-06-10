import { StateStatus } from "@prisma/client";

import { ListingWizard } from "@/components/borrower/listing-wizard";
import { FooterDisclosures } from "@/components/footer-disclosures";
import { NavBar } from "@/components/nav-bar";
import { SectionHead } from "@/components/section-head";
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
  const rawResume = Array.isArray(params.resume)
    ? params.resume[0]
    : params.resume;
  const state = rawState?.toUpperCase();
  const stateRule = state
    ? await prisma.stateRule.findUnique({ where: { state } })
    : null;

  return (
    <>
      <NavBar />
      <main className="vr-section bg-bone">
        <div className="vr-frame max-w-3xl">
          {!state || stateRule?.status === StateStatus.GREEN ? (
            <ListingWizard
              initialResumeToken={rawResume}
              initialState={state}
            />
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
