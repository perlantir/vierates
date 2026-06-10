"use client";

import { useMemo, useState } from "react";

import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Toast } from "@/components/ui/toast";
import { WizardShell } from "@/components/ui/wizard-shell";
import { consentTextForParty } from "@/lib/consent/text";

const stateOptions = ["CA", "CO", "FL", "IL", "TX", "WA", "NY", "NC"];

type FormState = {
  contactName: string;
  email: string;
  nmlsId: string;
  organizationName: string;
  phone: string;
  states: string[];
};

const initialState: FormState = {
  contactName: "",
  email: "",
  nmlsId: "",
  organizationName: "",
  phone: "",
  states: [],
};

export function FoundingLenderWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialState);
  const [consentHash, setConsentHash] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const totalSteps = 5;
  const canGoNext = useMemo(() => {
    if (step === 1) return form.organizationName.trim().length > 1;
    if (step === 2) return /^\d{4,10}$/.test(form.nmlsId);
    if (step === 3) return form.states.length > 0;
    if (step === 4) {
      return (
        form.contactName.trim().length > 1 &&
        form.email.includes("@") &&
        form.phone.trim().length >= 10
      );
    }
    return Boolean(consentHash);
  }, [consentHash, form, step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleState(state: string) {
    setForm((current) => ({
      ...current,
      states: current.states.includes(state)
        ? current.states.filter((item) => item !== state)
        : [...current.states, state],
    }));
  }

  async function submit() {
    setStatus("loading");
    const response = await fetch("/api/lender-applications", {
      body: JSON.stringify({
        ...form,
        consentTextShown: consentTextForParty("VieRates"),
        textShownSha256: consentHash,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setStatus(response.ok ? "success" : "error");
  }

  return (
    <WizardShell
      currentStep={step}
      onBack={step > 1 ? () => setStep((value) => value - 1) : undefined}
      storageKey="founding-lender"
      title={titleForStep(step)}
      totalSteps={totalSteps}
      whyWeAsk="VieRates approves lenders by organization, NMLS record, states licensed, and coverage fit before any board access."
    >
      {step === 1 ? (
        <Field
          label="Organization legal name"
          onChange={(value) => update("organizationName", value)}
          placeholder="Cardinal Home Lending, LLC"
          value={form.organizationName}
        />
      ) : null}
      {step === 2 ? (
        <Field
          data
          label="NMLS ID"
          onChange={(value) => update("nmlsId", value)}
          placeholder="1234567"
          value={form.nmlsId}
        />
      ) : null}
      {step === 3 ? (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          data-testid="states-step"
        >
          {stateOptions.map((state) => (
            <Chip
              key={state}
              onClick={() => toggleState(state)}
              selected={form.states.includes(state)}
            >
              {state}
            </Chip>
          ))}
        </div>
      ) : null}
      {step === 4 ? (
        <div className="grid gap-4">
          <Field
            label="Contact name"
            onChange={(value) => update("contactName", value)}
            placeholder="Alex Morgan"
            value={form.contactName}
          />
          <Field
            label="Work email"
            onChange={(value) => update("email", value)}
            placeholder="alex@example.com"
            type="email"
            value={form.email}
          />
          <Field
            data
            label="Direct line"
            onChange={(value) => update("phone", value)}
            placeholder="3125550188"
            type="tel"
            value={form.phone}
          />
        </div>
      ) : null}
      {step === 5 ? (
        <div className="grid gap-5">
          <ConsentCheckbox
            onConsent={({ textShownSha256 }) => setConsentHash(textShownSha256)}
            partyName="VieRates"
          />
          {status === "success" ? (
            <Toast tone="success">Application queued for admin review.</Toast>
          ) : null}
          {status === "error" ? (
            <Toast tone="danger">
              That did not save. Check the form and try again.
            </Toast>
          ) : null}
        </div>
      ) : null}
      <div className="mt-7 flex justify-end">
        {step < totalSteps ? (
          <Button
            disabled={!canGoNext}
            onClick={() => setStep((value) => value + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            disabled={
              !canGoNext || status === "loading" || status === "success"
            }
            onClick={() => void submit()}
          >
            Apply to become a Founding Lender
          </Button>
        )}
      </div>
    </WizardShell>
  );
}

function Field({
  data = false,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  data?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        className={[
          "mt-2 min-h-11 w-full rounded-ui border border-line bg-paper px-4 text-base text-ink placeholder:text-slate",
          data ? "vr-data" : "",
        ].join(" ")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function titleForStep(step: number) {
  if (step === 1) return "What is your organization name?";
  if (step === 2) return "What is your NMLS ID?";
  if (step === 3) return "Where are you licensed?";
  if (step === 4) return "Who should we contact?";
  return "Confirm named consent";
}
