"use client";

import { useEffect, useState } from "react";

import { ProgressBar } from "@/components/ui/progress-bar";

type WizardShellProps = {
  children: React.ReactNode;
  currentStep: number;
  footnote?: string;
  onBack?: () => void;
  storageKey?: string;
  title: string;
  totalSteps: number;
  whyWeAsk?: string;
};

export function WizardShell({
  children,
  currentStep,
  footnote = "🔒 Anonymous — we never sell your info",
  onBack,
  storageKey,
  title,
  totalSteps,
  whyWeAsk,
}: WizardShellProps) {
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (storageKey) {
      sessionStorage.setItem(`${storageKey}:step`, String(currentStep));
    }
  }, [currentStep, storageKey]);

  return (
    <section className="mx-auto w-full max-w-[480px] overflow-hidden">
      <ProgressBar value={(currentStep / totalSteps) * 100} />
      <div className="pt-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            aria-label="Go back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-line bg-card text-xl font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-40"
            disabled={!onBack}
            onClick={onBack}
            type="button"
          >
            ‹
          </button>
          <p className="text-xs font-semibold text-text-muted">
            About 60 seconds
          </p>
        </div>
        <h1 className="font-sans text-3xl font-semibold leading-tight text-ink md:text-[30px] md:leading-[38px]">
          {title}
        </h1>
        {whyWeAsk ? (
          <div className="mt-3">
            <button
              className="text-sm font-semibold text-text-muted underline underline-offset-4"
              onClick={() => setShowWhy((value) => !value)}
              type="button"
            >
              Why we ask
            </button>
            {showWhy ? (
              <p className="mt-2 rounded-ui border border-line bg-card p-3 text-sm leading-6 text-text-muted">
                {whyWeAsk}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-7">{children}</div>
        <p className="mt-6 border-t border-line pt-4 text-xs font-semibold text-text-muted">
          {footnote}
        </p>
      </div>
    </section>
  );
}
