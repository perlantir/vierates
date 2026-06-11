import { StateStatus } from "@prisma/client";

import { ListingWizard } from "@/components/borrower/listing-wizard";
import { SectionHead } from "@/components/section-head";
import { WaitlistForm } from "@/components/waitlist-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    <main className="min-h-screen bg-bone px-5 py-6 md:px-8 md:py-10">
      {!state || stateRule?.status === StateStatus.GREEN ? (
        <ListingWizard initialResumeToken={rawResume} initialState={state} />
      ) : null}
      {state && stateRule?.status !== StateStatus.GREEN ? (
        <div className="mx-auto max-w-[480px]">
          <GatedState state={state} />
        </div>
      ) : null}
    </main>
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
