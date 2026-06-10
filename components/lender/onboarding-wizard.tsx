"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Slider } from "@/components/ui/slider";
import { WizardShell } from "@/components/ui/wizard-shell";

type OnboardingData = {
  dba?: string;
  ficoMin: number;
  inviteEmail?: string;
  legalName?: string;
  loanMax: number;
  loanMin: number;
  ltvMaxBp: number;
  nmlsId?: string;
  orgAdminEmail?: string;
  plan: "STARTER" | "PRO" | "BRANCH";
  products: string[];
  purposes: string[];
  statesLicensed: string[];
};

const states = ["CA", "CO", "FL", "IL", "TX"] as const;
const products = ["30Y_FIXED", "20Y_FIXED", "15Y_FIXED"] as const;
const purposes = ["REFINANCE", "CASH_OUT", "PURCHASE"] as const;

export function LenderOnboardingWizard() {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    ficoMin: 660,
    loanMax: 900000,
    loanMin: 150000,
    ltvMaxBp: 8500,
    plan: "STARTER",
    products: ["30Y_FIXED"],
    purposes: ["REFINANCE"],
    statesLicensed: ["IL"],
  });

  async function submit() {
    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch("/api/lender/onboarding", {
      body: JSON.stringify({
        coverage: {
          ficoMin: data.ficoMin,
          loanMax: data.loanMax,
          loanMin: data.loanMin,
          ltvMaxBp: data.ltvMaxBp,
          products: data.products,
          purposes: data.purposes,
          states: data.statesLicensed,
        },
        dba: data.dba,
        invites: data.inviteEmail ? [data.inviteEmail] : [],
        legalName: data.legalName,
        nmlsId: data.nmlsId,
        orgAdminEmail: data.orgAdminEmail,
        plan: data.plan,
        statesLicensed: data.statesLicensed,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      status?: string;
    };

    setIsBusy(false);

    if (!response.ok) {
      setMessage(result.error ?? "Onboarding could not be submitted.");
      return;
    }

    setMessage(`Submitted for admin approval. Status: ${result.status}.`);
    setStep(8);
  }

  return (
    <WizardShell
      currentStep={step}
      footnote="Pending orgs cannot access the board."
      onBack={
        step > 1 && step < 8 ? () => setStep((value) => value - 1) : undefined
      }
      storageKey="vierates:lender-onboarding"
      title={titleForStep(step)}
      totalSteps={8}
      whyWeAsk={
        step === 3 ? "NMLS is checked by admin before board access." : undefined
      }
    >
      {step === 1 ? (
        <TextStep
          label="Organization legal name"
          onNext={(value) => {
            setData((current) => ({ ...current, legalName: value }));
            setStep(2);
          }}
          value={data.legalName}
        />
      ) : null}
      {step === 2 ? (
        <TextStep
          label="DBA"
          onNext={(value) => {
            setData((current) => ({ ...current, dba: value }));
            setStep(3);
          }}
          optional
          value={data.dba}
        />
      ) : null}
      {step === 3 ? (
        <TextStep
          label="NMLS ID"
          onNext={(value) => {
            setData((current) => ({ ...current, nmlsId: value }));
            setStep(4);
          }}
          value={data.nmlsId}
        />
      ) : null}
      {step === 4 ? (
        <ToggleGrid
          options={states}
          selected={data.statesLicensed}
          onChange={(next) =>
            setData((current) => ({ ...current, statesLicensed: next }))
          }
          onNext={() => setStep(5)}
        />
      ) : null}
      {step === 5 ? (
        <div className="grid gap-5">
          <Slider
            label="FICO floor"
            max={780}
            min={580}
            onChange={(ficoMin) =>
              setData((current) => ({ ...current, ficoMin }))
            }
            step={20}
            value={data.ficoMin}
          />
          <Slider
            label="Max LTV"
            max={9500}
            min={6000}
            onChange={(ltvMaxBp) =>
              setData((current) => ({ ...current, ltvMaxBp }))
            }
            step={500}
            suffix=" bp"
            value={data.ltvMaxBp}
          />
          <Button onClick={() => setStep(6)}>Next</Button>
        </div>
      ) : null}
      {step === 6 ? (
        <div className="grid gap-5">
          <ToggleGrid
            options={products}
            selected={data.products}
            onChange={(next) =>
              setData((current) => ({ ...current, products: next }))
            }
          />
          <ToggleGrid
            options={purposes}
            selected={data.purposes}
            onChange={(next) =>
              setData((current) => ({ ...current, purposes: next }))
            }
            onNext={() => setStep(7)}
          />
        </div>
      ) : null}
      {step === 7 ? (
        <div className="grid gap-5">
          <Slider
            label="Loan minimum"
            max={500000}
            min={50000}
            onChange={(loanMin) =>
              setData((current) => ({ ...current, loanMin }))
            }
            step={25000}
            value={data.loanMin}
          />
          <Slider
            label="Loan maximum"
            max={3000000}
            min={500000}
            onChange={(loanMax) =>
              setData((current) => ({ ...current, loanMax }))
            }
            step={50000}
            value={data.loanMax}
          />
          <Button onClick={() => setStep(8)}>Next</Button>
        </div>
      ) : null}
      {step === 8 ? (
        <div className="grid gap-4">
          <TextInput
            label="Org admin email"
            onChange={(orgAdminEmail) =>
              setData((current) => ({ ...current, orgAdminEmail }))
            }
            value={data.orgAdminEmail}
          />
          <TextInput
            label="Invite LO email"
            onChange={(inviteEmail) =>
              setData((current) => ({ ...current, inviteEmail }))
            }
            value={data.inviteEmail}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {(["STARTER", "PRO", "BRANCH"] as const).map((plan) => (
              <Chip
                key={plan}
                onClick={() => setData((current) => ({ ...current, plan }))}
                selected={data.plan === plan}
              >
                {plan}
              </Chip>
            ))}
          </div>
          <Button
            disabled={
              isBusy || !data.legalName || !data.nmlsId || !data.orgAdminEmail
            }
            onClick={() => void submit()}
          >
            Submit for approval
          </Button>
          {message ? (
            <p className="rounded-ui border border-line bg-bone p-3 text-sm text-slate">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </WizardShell>
  );
}

function TextStep({
  label,
  onNext,
  optional = false,
  value,
}: {
  label: string;
  onNext: (value: string) => void;
  optional?: boolean;
  value?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");

  return (
    <div className="grid gap-4">
      <TextInput label={label} onChange={setDraft} value={draft} />
      <Button
        disabled={!optional && draft.length < 2}
        onClick={() => onNext(draft)}
      >
        Next
      </Button>
    </div>
  );
}

function TextInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      <input
        className="min-h-11 rounded-ui border border-line bg-paper px-3 text-base font-normal"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      />
    </label>
  );
}

function ToggleGrid({
  onChange,
  onNext,
  options,
  selected,
}: {
  onChange: (value: string[]) => void;
  onNext?: () => void;
  options: readonly string[];
  selected: string[];
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Chip
              key={option}
              onClick={() =>
                onChange(
                  isSelected
                    ? selected.filter((item) => item !== option)
                    : [...selected, option],
                )
              }
              selected={isSelected}
            >
              {option}
            </Chip>
          );
        })}
      </div>
      {onNext ? (
        <Button disabled={selected.length === 0} onClick={onNext}>
          Next
        </Button>
      ) : null}
    </div>
  );
}

function titleForStep(step: number): string {
  return (
    [
      "Legal name",
      "DBA",
      "NMLS ID",
      "States licensed",
      "Coverage limits",
      "Products and purposes",
      "Loan range",
      "Plan and invites",
    ][step - 1] ?? "Lender onboarding"
  );
}
