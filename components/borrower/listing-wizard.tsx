"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { TwoDoors } from "@/components/borrower/two-doors";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Slider } from "@/components/ui/slider";
import { WizardShell } from "@/components/ui/wizard-shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { borrowerSessionHeader, smsOptInText } from "@/lib/borrower/shared";

const storageKey = "vierates:list";
const totalSteps = 12;

type WizardData = {
  address?: string;
  balanceAmount?: number;
  challengeId?: string;
  county?: string;
  creditBandStated?: string;
  currentRateBand?: string;
  estValueAmount?: number;
  incomeBandStated?: string;
  occupancy?: string;
  phone?: string;
  propertyMatchOk?: boolean;
  propertyType?: string;
  purpose?: string;
  state?: string;
  timeline?: string;
};

type ListingResult = {
  id: string;
  manualReview: boolean;
  status: string;
};

type ListingWizardProps = {
  initialResumeToken?: string;
  initialState?: string;
};

const purposeOptions = [
  ["REFINANCE", "Lower my payment"],
  ["CASH_OUT", "Get cash out"],
  ["PAY_OFF_FASTER", "Pay off faster"],
  ["JUST_SEE_BIDS", "Just see bids"],
] as const;

const propertyTypeOptions = [
  ["SINGLE_FAMILY", "Single-family"],
  ["CONDO", "Condo"],
  ["TOWNHOME", "Townhome"],
  ["TWO_TO_FOUR_UNITS", "2-4 units"],
] as const;

const occupancyOptions = [
  ["PRIMARY", "I live there"],
  ["SECOND_HOME", "Second home"],
  ["RENTAL", "Rental"],
] as const;

const rateOptions = [
  ["LT_5_5", "<5.5%"],
  ["5_5_TO_6", "5.5-6%"],
  ["6_TO_6_5", "6-6.5%"],
  ["6_5_TO_7", "6.5-7%"],
  ["7_PLUS", "7%+"],
  ["NOT_SURE", "Not sure"],
] as const;

const creditOptions = [
  ["740_PLUS", "Excellent 740+"],
  ["700_739", "Good 700-739"],
  ["660_699", "Fair 660-699"],
  ["LT_660", "Building <660"],
] as const;

const incomeOptions = [
  ["LT_100K", "Under $100k"],
  ["100K_150K", "$100k-$150k"],
  ["150K_200K", "$150k-$200k"],
  ["200K_PLUS", "$200k+"],
] as const;

const timelineOptions = [
  ["ASAP", "ASAP"],
  ["ONE_TO_THREE_MONTHS", "1-3 months"],
  ["JUST_WATCHING", "Just watching"],
] as const;

const launchStates = ["CA", "CO", "FL", "IL", "TX"] as const;

export function ListingWizard({
  initialResumeToken,
  initialState,
}: ListingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(() => ({
    balanceAmount: 255_000,
    estValueAmount: 412_000,
    state: initialState,
  }));
  const [sessionId, setSessionId] = useState("");
  const [resumeToken, setResumeToken] = useState(initialResumeToken);
  const [resumeUrl, setResumeUrl] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [code, setCode] = useState("");
  const [smsConsentAccepted, setSmsConsentAccepted] = useState(false);
  const [listingResult, setListingResult] = useState<ListingResult>();
  const [gatedState, setGatedState] = useState<string>();

  const captureFunnel = useCallback(
    async (
      event: "wizard_step_viewed" | "wizard_step_completed",
      viewedStep: string,
      metadata: Record<string, string | number | boolean | undefined> = {},
    ) => {
      if (!sessionId) {
        return;
      }

      await fetch("/api/analytics/funnel", {
        body: JSON.stringify({
          event,
          metadata,
          sessionId,
          step: viewedStep,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }).catch(() => undefined);
    },
    [sessionId],
  );

  useEffect(() => {
    const existingSession =
      sessionStorage.getItem(`${storageKey}:session`) ?? crypto.randomUUID();
    sessionStorage.setItem(`${storageKey}:session`, existingSession);
    setSessionId(existingSession);

    localStorage.removeItem(`${storageKey}:session`);
    localStorage.removeItem(`${storageKey}:data`);
    localStorage.removeItem(`${storageKey}:current`);
  }, []);

  useEffect(() => {
    if (!initialResumeToken) {
      return;
    }

    void fetch(`/api/borrower/wizard-draft?token=${initialResumeToken}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((draft: { data?: WizardData; state?: string } | null) => {
        if (draft?.data) {
          setData((current) => ({ ...current, ...draft.data }));
        }
      });
  }, [initialResumeToken]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    void captureFunnel("wizard_step_viewed", stepName(step));
  }, [captureFunnel, sessionId, step]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const handle = window.setTimeout(() => {
      void fetch("/api/borrower/wizard-draft", {
        body: JSON.stringify({
          data: listingDraftPayload(data),
          resumeToken,
          state: data.state,
        }),
        headers: {
          "content-type": "application/json",
          [borrowerSessionHeader]: sessionId,
        },
        method: "POST",
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((draft: { resumeToken?: string; resumeUrl?: string } | null) => {
          if (draft?.resumeToken) {
            setResumeToken(draft.resumeToken);
            setResumeUrl(draft.resumeUrl);
          }
        });
    }, 650);

    return () => window.clearTimeout(handle);
  }, [data, resumeToken, sessionId]);

  const ltv = useMemo(() => {
    const balance = data.balanceAmount ?? 320_000;
    const value = data.estValueAmount ?? 500_000;
    return Math.round((balance / value) * 100);
  }, [data.balanceAmount, data.estValueAmount]);

  function choose(field: keyof WizardData, value: string | number | boolean) {
    setData((current) => ({ ...current, [field]: value }));
    void captureFunnel("wizard_step_completed", stepName(step), { field });
    window.setTimeout(
      () => setStep((current) => Math.min(totalSteps, current + 1)),
      250,
    );
  }

  async function runPropertyMatch() {
    setMessage(undefined);
    setIsBusy(true);

    try {
      const response = await fetch("/api/borrower/property-match", {
        body: JSON.stringify({
          address: data.address,
          state: data.state,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        county?: string;
        error?: string;
        gated?: boolean;
        propertyMatchOk?: boolean;
        state?: string;
      };

      if (!response.ok) {
        setMessage(result.error ?? "Property match failed.");
        return;
      }

      if (result.gated && result.state) {
        setGatedState(result.state);
        return;
      }

      setData((current) => ({
        ...current,
        county: result.county,
        propertyMatchOk: Boolean(result.propertyMatchOk),
        state: result.state,
      }));
      void captureFunnel("wizard_step_completed", "property", {
        propertyMatchOk: result.propertyMatchOk,
      });
      window.setTimeout(() => setStep(3), 250);
    } finally {
      setIsBusy(false);
    }
  }

  async function sendCode() {
    setMessage(undefined);
    setIsBusy(true);

    try {
      const response = await fetch("/api/borrower/otp/start", {
        body: JSON.stringify({ phone: data.phone }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        challengeId?: string;
        code?: string;
        consentText?: string;
        demoCode?: string;
        error?: string;
      };

      if (!response.ok || !result.challengeId) {
        setMessage(result.error ?? "Code could not be sent.");
        return;
      }

      setData((current) => ({ ...current, challengeId: result.challengeId }));
      setMessage(
        result.demoCode
          ? `Demo code sent. Use ${result.demoCode}.`
          : "Code sent.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function verifyAndSubmit() {
    setMessage(undefined);
    setIsBusy(true);

    try {
      const verifyResponse = await fetch("/api/borrower/otp/verify", {
        body: JSON.stringify({
          challengeId: data.challengeId,
          code,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const verification = (await verifyResponse.json()) as { error?: string };

      if (!verifyResponse.ok) {
        setMessage(
          verification.error ?? "That code didn't match — try the newest text.",
        );
        return;
      }

      const listingResponse = await fetch("/api/borrower/listings", {
        body: JSON.stringify({
          balanceAmount: data.balanceAmount,
          challengeId: data.challengeId,
          county: data.county,
          creditBandStated: data.creditBandStated,
          currentRateBand: data.currentRateBand,
          estValueAmount: data.estValueAmount,
          incomeBandStated: data.incomeBandStated,
          occupancy: data.occupancy,
          propertyMatchOk: data.propertyMatchOk,
          propertyType: data.propertyType,
          purpose: data.purpose,
          state: data.state,
          timeline: data.timeline,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const listing = (await listingResponse.json()) as
        | (ListingResult & { error?: string })
        | { error?: string };

      if (!listingResponse.ok || !("id" in listing)) {
        setMessage(listing.error ?? "Listing could not be created.");
        return;
      }

      setListingResult(listing);
      sessionStorage.removeItem(`${storageKey}:session`);
      void captureFunnel("wizard_step_completed", "phone_otp");
      setStep(12);
    } finally {
      setIsBusy(false);
    }
  }

  if (gatedState) {
    return (
      <div className="vr-card p-6" data-testid="gated-state">
        <h1 className="font-sans text-3xl font-semibold text-ink">
          VieRates isn&apos;t live in {gatedState} yet.
        </h1>
        <p className="mt-3 text-text-muted">
          Leave your email and we will tell you when anonymous listings open
          there.
        </p>
        <div className="mt-6">
          <WaitlistForm source={`gated-${gatedState}`} />
        </div>
      </div>
    );
  }

  return (
    <WizardShell
      currentStep={step}
      footnote="🔒 Anonymous — we never sell your info"
      onBack={
        step > 1 && step < 12 ? () => setStep((value) => value - 1) : undefined
      }
      storageKey={storageKey}
      title={titleForStep(step)}
      totalSteps={totalSteps}
      whyWeAsk={whyForStep(step)}
    >
      {step === 1 ? (
        <ChoiceGrid
          field="purpose"
          onChoose={choose}
          options={purposeOptions}
          selected={data.purpose}
        />
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Street address
            <input
              autoComplete="street-address"
              className="min-h-14 rounded-ui border border-line bg-card px-3 text-base font-normal"
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              placeholder="123 Main St"
              value={data.address ?? ""}
            />
          </label>
          <p className="text-sm leading-6 text-text-muted">
            Checked against public records, then sealed. Lenders never see your
            street address.
          </p>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            State
            <select
              className="min-h-14 rounded-ui border border-line bg-card px-3 text-base font-normal"
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  state: event.target.value,
                }))
              }
              value={data.state ?? ""}
            >
              <option value="">Choose state</option>
              {launchStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
              <option value="NY">NY</option>
            </select>
          </label>
          {message ? <StatusMessage>{message}</StatusMessage> : null}
          {data.propertyMatchOk === false ? (
            <StatusMessage>
              We could not match the property automatically. You can continue,
              and a VieRates reviewer will check it before lenders see it.
            </StatusMessage>
          ) : null}
          <Button
            disabled={!data.address || !data.state || isBusy}
            onClick={() => void runPropertyMatch()}
          >
            Match property
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <ChoiceGrid
          field="propertyType"
          onChoose={choose}
          options={propertyTypeOptions}
          selected={data.propertyType}
        />
      ) : null}

      {step === 4 ? (
        <ChoiceGrid
          field="occupancy"
          onChoose={choose}
          options={occupancyOptions}
          selected={data.occupancy}
        />
      ) : null}

      {step === 5 ? (
        <div className="grid gap-5">
          <p className="text-sm text-text-muted">
            We estimate{" "}
            <span className="vr-data font-semibold text-ink">
              ${(data.estValueAmount ?? 412_000).toLocaleString()}
            </span>{" "}
            — sound right?
          </p>
          <Slider
            label="Estimated value"
            max={1_500_000}
            min={150_000}
            onChange={(value) =>
              setData((current) => ({ ...current, estValueAmount: value }))
            }
            step={25_000}
            value={data.estValueAmount ?? 500_000}
          />
          <Button
            onClick={() =>
              choose("estValueAmount", data.estValueAmount ?? 412_000)
            }
          >
            Save estimated value
          </Button>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="grid gap-5">
          <Slider
            label="Approximate balance"
            max={1_250_000}
            min={50_000}
            onChange={(value) =>
              setData((current) => ({ ...current, balanceAmount: value }))
            }
            step={10_000}
            value={data.balanceAmount ?? 320_000}
          />
          <p className="text-sm text-text-muted">
            ≈ <span className="vr-data font-semibold text-ink">{ltv}%</span> of
            your home&apos;s value
          </p>
          <Button
            onClick={() =>
              choose("balanceAmount", data.balanceAmount ?? 320_000)
            }
          >
            Save loan balance
          </Button>
        </div>
      ) : null}

      {step === 7 ? (
        <ChoiceGrid
          field="currentRateBand"
          onChoose={choose}
          options={rateOptions}
          selected={data.currentRateBand}
        />
      ) : null}

      {step === 8 ? (
        <div className="grid gap-4">
          <ChoiceGrid
            field="creditBandStated"
            onChoose={choose}
            options={creditOptions}
            selected={data.creditBandStated}
          />
          <p className="text-sm text-text-muted">
            Just your best guess — no credit check here.
          </p>
        </div>
      ) : null}

      {step === 9 ? (
        <ChoiceGrid
          field="incomeBandStated"
          onChoose={choose}
          options={incomeOptions}
          selected={data.incomeBandStated}
        />
      ) : null}

      {step === 10 ? (
        <ChoiceGrid
          field="timeline"
          onChoose={choose}
          options={timelineOptions}
          selected={data.timeline}
        />
      ) : null}

      {step === 11 ? (
        <div className="grid gap-4">
          <p className="text-sm text-text-muted">
            We&apos;ll text one code. We never sell your number.
          </p>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Mobile phone
            <input
              autoComplete="tel"
              className="min-h-14 rounded-ui border border-line bg-card px-3 text-base font-normal"
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              value={data.phone ?? ""}
            />
          </label>
          <label className="flex items-start gap-3 rounded-ui border border-line bg-card p-3 text-xs leading-5 text-text-muted">
            <input
              checked={smsConsentAccepted}
              className="mt-1 h-4 w-4 accent-ink"
              onChange={(event) => setSmsConsentAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>{smsOptInText(data.phone ?? "your number")}</span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={!data.phone || !smsConsentAccepted || isBusy}
              onClick={() => void sendCode()}
              variant="secondary"
            >
              Send code
            </Button>
            <label className="grid flex-1 gap-2 text-sm font-semibold text-ink">
              Verification code
              <input
                className="min-h-14 rounded-ui border border-line bg-card px-3 text-center font-mono text-2xl font-medium tracking-[0.45em]"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                value={code}
              />
            </label>
          </div>
          {message ? <StatusMessage>{message}</StatusMessage> : null}
          <Button
            disabled={!data.challengeId || code.length < 6 || isBusy}
            onClick={() => void verifyAndSubmit()}
          >
            Create my anonymous listing
          </Button>
        </div>
      ) : null}

      {step === 12 ? (
        <DoneScreen listingResult={listingResult} resumeUrl={resumeUrl} />
      ) : null}

      {resumeUrl && step < 12 ? (
        <span className="sr-only">Resume link saved: {resumeUrl}</span>
      ) : null}
    </WizardShell>
  );
}

function listingDraftPayload(data: WizardData): Partial<WizardData> {
  return {
    balanceAmount: data.balanceAmount,
    county: data.county,
    creditBandStated: data.creditBandStated,
    currentRateBand: data.currentRateBand,
    estValueAmount: data.estValueAmount,
    incomeBandStated: data.incomeBandStated,
    occupancy: data.occupancy,
    propertyMatchOk: data.propertyMatchOk,
    propertyType: data.propertyType,
    purpose: data.purpose,
    state: data.state,
    timeline: data.timeline,
  };
}

function ChoiceGrid({
  field,
  onChoose,
  options,
  selected,
}: {
  field: keyof WizardData;
  onChoose: (field: keyof WizardData, value: string) => void;
  options: readonly (readonly [string, string])[];
  selected?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(([value, label]) => (
        <Chip
          key={value}
          onClick={() => onChoose(field, value)}
          selected={selected === value}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}

function DoneScreen({
  listingResult,
  resumeUrl,
}: {
  listingResult?: ListingResult;
  resumeUrl?: string;
}) {
  return (
    <div className="grid gap-6" data-testid="listing-done">
      {listingResult?.manualReview ? (
        <p className="rounded-ui border border-info bg-info-tint p-3 text-sm font-semibold text-info">
          Your listing is in manual review.
        </p>
      ) : null}
      <TwoDoors />
      {resumeUrl ? (
        <p className="text-xs text-text-muted">
          Resume link kept for your records:{" "}
          <span className="vr-data">{resumeUrl}</span>
        </p>
      ) : null}
    </div>
  );
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-ui border border-line bg-paper p-3 text-sm leading-6 text-text-muted">
      {children}
    </p>
  );
}

function stepName(step: number): string {
  return (
    [
      "goal",
      "property",
      "type",
      "occupancy",
      "value",
      "balance",
      "rate",
      "credit",
      "income",
      "timeline",
      "phone_otp",
      "done",
    ][step - 1] ?? "unknown"
  );
}

function titleForStep(step: number): string {
  const titles = [
    "What do you want to do?",
    "Where's the property?",
    "What kind of property?",
    "How do you use it?",
    "What's it worth, roughly?",
    "About how much do you owe?",
    "What's your current rate?",
    "How's your credit?",
    "Household income, before taxes?",
    "When do you want to move?",
    "Last step — prove you're human.",
    "You're listed. Here's your market.",
  ];

  return titles[step - 1] ?? titles[0];
}

function whyForStep(step: number): string | undefined {
  const reasons: Record<number, string> = {
    2: "State, county, and a property match help lenders bid on the right profile. We discard the street address from marketplace storage.",
    6: "Loan-to-value helps lenders decide whether your profile fits their coverage box.",
    8: "A stated band helps place your listing before verification. The Bid Room verifies later with a soft credit check.",
    11: "The code reduces spam listings and keeps one active listing per phone.",
  };

  return reasons[step];
}
