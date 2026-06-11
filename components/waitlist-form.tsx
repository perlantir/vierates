"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

type WaitlistFormProps = {
  source?: string;
};

const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export function WaitlistForm({ source = "waitlist" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/waitlist", {
      body: JSON.stringify({ email, source, state }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setStatus(response.ok ? "success" : "error");
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
        <label
          className="grid gap-2 text-sm font-semibold text-ink"
          htmlFor={`${source}-email`}
        >
          Email
          <input
            className="min-h-11 rounded-ui border border-line bg-card px-4 text-base font-normal text-ink placeholder:text-text-muted"
            id={`${source}-email`}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>
        <label
          className="grid gap-2 text-sm font-semibold text-ink"
          htmlFor={`${source}-state`}
        >
          State
          <select
            className="min-h-11 rounded-ui border border-line bg-card px-3 text-base font-normal text-ink"
            id={`${source}-state`}
            name="state"
            onChange={(event) => setState(event.target.value)}
            required
            value={state}
          >
            <option value="">Choose</option>
            {states.map((stateCode) => (
              <option key={stateCode} value={stateCode}>
                {stateCode}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={status === "loading"} type="submit">
          Join waitlist
        </Button>
      </div>
      <p className="text-sm leading-6 text-text-muted">
        One email when we open in your state. No marketing drip.
      </p>
      {status === "success" ? (
        <div className="sm:col-span-2" data-testid="waitlist-success">
          <Toast tone="success">
            You&apos;re on the list{state ? ` for ${state}` : ""}.
          </Toast>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="sm:col-span-2">
          <Toast tone="danger">
            That did not save. Check the email and try again.
          </Toast>
        </div>
      ) : null}
    </form>
  );
}
