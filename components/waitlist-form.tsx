"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

type WaitlistFormProps = {
  source?: string;
};

export function WaitlistForm({ source = "waitlist" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/waitlist", {
      body: JSON.stringify({ email, source }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setStatus(response.ok ? "success" : "error");
  }

  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submit}>
      <label className="sr-only" htmlFor={`${source}-email`}>
        Email
      </label>
      <input
        className="min-h-11 rounded-ui border border-line bg-paper px-4 text-base text-ink placeholder:text-slate"
        id={`${source}-email`}
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />
      <Button disabled={status === "loading"} type="submit">
        Join waitlist
      </Button>
      {status === "success" ? (
        <div className="sm:col-span-2" data-testid="waitlist-success">
          <Toast tone="success">You are on the waitlist.</Toast>
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
