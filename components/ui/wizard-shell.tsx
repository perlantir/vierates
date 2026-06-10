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
  footnote = "Anonymous. We never sell your info.",
  onBack,
  storageKey,
  title,
  totalSteps,
  whyWeAsk,
}: WizardShellProps) {
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`${storageKey}:step`, String(currentStep));
    }
  }, [currentStep, storageKey]);

  return (
    <section className="vr-card mx-auto max-w-2xl overflow-hidden">
      <ProgressBar value={(currentStep / totalSteps) * 100} />
      <div className="p-5 md:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            className="min-h-11 rounded-ui border border-line px-3 text-sm font-semibold text-ink disabled:opacity-40"
            disabled={!onBack}
            onClick={onBack}
            type="button"
          >
            Back
          </button>
          <p className="vr-data text-xs text-slate">
            {currentStep}/{totalSteps}
          </p>
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
          {title}
        </h1>
        {whyWeAsk ? (
          <div className="mt-3">
            <button
              className="text-sm font-semibold text-slate underline underline-offset-4"
              onClick={() => setShowWhy((value) => !value)}
              type="button"
            >
              Why we ask
            </button>
            {showWhy ? (
              <p className="mt-2 rounded-ui border border-line bg-bone p-3 text-sm leading-6 text-slate">
                {whyWeAsk}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-7">{children}</div>
        <p className="mt-6 border-t border-line pt-4 text-xs font-semibold text-slate">
          {footnote}
        </p>
      </div>
    </section>
  );
}
