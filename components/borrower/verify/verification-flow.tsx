"use client";

import { useEffect, useState } from "react";

import { MaskedProfilePreview } from "@/components/borrower/verify/masked-profile-preview";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WizardShell } from "@/components/ui/wizard-shell";
import type { MaskedProfilePreview as MaskedProfilePreviewData } from "@/lib/borrower/masked-preview";
import { HPPA_OPTIN_TEXT, SOFT_PULL_SENTENCE } from "@/lib/consent/text";

type VerificationListing = {
  auction?: {
    opensAt: string;
    status: string;
  } | null;
  id: string;
  state: string;
};

type VerificationFlowProps = {
  listing?: VerificationListing | null;
};

type AuctionResult = {
  id: string;
  opensAt: string;
  status: string;
};

const storageKey = "vierates:verify";

export function VerificationFlow({ listing }: VerificationFlowProps) {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [preview, setPreview] = useState<MaskedProfilePreviewData>();
  const [auction, setAuction] = useState<AuctionResult | undefined>(
    listing?.auction
      ? {
          id: "",
          opensAt: listing.auction.opensAt,
          status: listing.auction.status,
        }
      : undefined,
  );

  useEffect(() => {
    const savedStep = sessionStorage.getItem(`${storageKey}:step`);

    if (savedStep) {
      setStep(Number(savedStep));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(`${storageKey}:step`, String(step));
  }, [step]);

  if (!listing) {
    return (
      <main className="vr-section min-h-screen bg-bone">
        <div className="vr-frame">
          <EmptyState
            actionHref="/app/new"
            actionLabel="Start my free listing"
            body="Create a listing before opening a Bid Room."
            title="No listing ready"
          />
        </div>
      </main>
    );
  }

  async function runCreditSandbox() {
    await runVerificationStep("/api/borrower/verify/credit", () => setStep(3));
  }

  async function runIncomeSandbox() {
    await runVerificationStep("/api/borrower/verify/income", () => setStep(4));
    await loadPreview();
  }

  async function runVerificationStep(endpoint: string, onSuccess: () => void) {
    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch(endpoint, {
      body: JSON.stringify({ listingId: listing?.id }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    setIsBusy(false);

    if (!response.ok) {
      setMessage(
        result.error ??
          "Verification needs a human review. We saved your place.",
      );
      return;
    }

    onSuccess();
  }

  async function loadPreview() {
    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch("/api/borrower/verify/preview", {
      body: JSON.stringify({ listingId: listing?.id }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      preview?: MaskedProfilePreviewData;
    };

    setIsBusy(false);

    if (!response.ok || !result.preview) {
      setMessage(result.error ?? "Masked preview could not be loaded.");
      return;
    }

    setPreview(result.preview);
  }

  async function scheduleAuction() {
    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch("/api/borrower/verify/schedule", {
      body: JSON.stringify({ listingId: listing?.id }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as AuctionResult & {
      error?: string;
    };

    setIsBusy(false);

    if (!response.ok || !result.id) {
      setMessage(result.error ?? "Bid Room could not be scheduled.");
      return;
    }

    setAuction(result);
    setStep(5);
    sessionStorage.removeItem(`${storageKey}:step`);
  }

  return (
    <main className="vr-section min-h-screen bg-bone">
      <div className="vr-frame">
        <WizardShell
          currentStep={step}
          footnote="Anonymous - hidden until you pick"
          onBack={
            step > 1 && step < 5
              ? () => setStep((value) => value - 1)
              : undefined
          }
          storageKey={storageKey}
          title={titleForStep(step)}
          totalSteps={5}
          whyWeAsk={whyForStep(step)}
        >
          {step === 1 ? (
            <div className="grid gap-4">
              <p className="text-sm leading-6 text-slate">
                {SOFT_PULL_SENTENCE}
              </p>
              <p className="text-sm leading-6 text-slate">
                We verify credit and income once, then show lenders the same
                masked profile you can review first.
              </p>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          ) : null}

          {step === 2 ? (
            <SandboxCard
              body={SOFT_PULL_SENTENCE}
              buttonLabel="Run soft inquiry sandbox"
              disabled={isBusy}
              onClick={() => void runCreditSandbox()}
              title="Array credit sandbox"
            />
          ) : null}

          {step === 3 ? (
            <SandboxCard
              body={HPPA_OPTIN_TEXT}
              buttonLabel="Verify income sandbox"
              disabled={isBusy}
              onClick={() => void runIncomeSandbox()}
              title="Truv income sandbox"
            />
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4">
              {preview ? (
                <MaskedProfilePreview preview={preview} />
              ) : (
                <Button
                  disabled={isBusy}
                  onClick={() => void loadPreview()}
                  variant="secondary"
                >
                  Load masked preview
                </Button>
              )}
              <Button
                disabled={!preview || isBusy}
                onClick={() => void scheduleAuction()}
              >
                Schedule my Bid Room
              </Button>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-4" data-testid="verify-done">
              <p className="text-sm font-semibold text-funded">
                Your Bid Room opens at{" "}
                <span className="vr-data">
                  {auction
                    ? new Date(auction.opensAt).toLocaleString()
                    : "the scheduled time"}
                </span>
                .
              </p>
              <p className="text-sm leading-6 text-slate">
                Verified lenders in your coverage box can now prepare bids. Your
                identity is still hidden.
              </p>
              <Button href="/app" variant="secondary">
                Back to dashboard
              </Button>
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 rounded-ui border border-line bg-bone p-3 text-sm leading-6 text-slate">
              {message}
            </p>
          ) : null}

          {step < 5 ? (
            <p className="mt-5 text-xs text-slate">
              Resume link saved: <span className="vr-data">/app/verify</span>
            </p>
          ) : null}
        </WizardShell>
      </div>
    </main>
  );
}

function SandboxCard({
  body,
  buttonLabel,
  disabled,
  onClick,
  title,
}: {
  body: string;
  buttonLabel: string;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <div className="grid gap-4 rounded-ui border border-line bg-paper p-4">
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="text-sm leading-6 text-slate">{body}</p>
      <Button disabled={disabled} onClick={onClick}>
        {buttonLabel}
      </Button>
    </div>
  );
}

function titleForStep(step: number): string {
  return (
    [
      "Open your Bid Room",
      "Verify credit",
      "Verify income",
      "Preview your masked profile",
      "Your Bid Room is scheduled",
    ][step - 1] ?? "Open your Bid Room"
  );
}

function whyForStep(step: number): string | undefined {
  const reasons: Record<number, string> = {
    2: "Credit verification lets lenders place firm bids from a consistent profile.",
    3: "Income verification helps lenders estimate fit before spending a credit.",
    4: "The preview is built from the same masked lender data-access path used by the marketplace.",
  };

  return reasons[step];
}
