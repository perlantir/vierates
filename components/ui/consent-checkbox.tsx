"use client";

import { useState } from "react";

import { consentTextForParty } from "@/lib/consent/text";

type ConsentCheckboxProps = {
  label?: string;
  onConsent: (record: { textShownSha256: string }) => void;
  partyName: string;
};

export function ConsentCheckbox({
  label,
  onConsent,
  partyName,
}: ConsentCheckboxProps) {
  const [checked, setChecked] = useState(false);
  const textShown = label ?? consentTextForParty(partyName);

  async function handleChange(nextChecked: boolean) {
    setChecked(nextChecked);

    if (!nextChecked) {
      return;
    }

    const buffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(textShown),
    );
    const textShownSha256 = Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    onConsent({ textShownSha256 });
  }

  return (
    <label className="flex items-start gap-3 text-left text-xs leading-5 text-slate">
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-ink"
        onChange={(event) => void handleChange(event.target.checked)}
        type="checkbox"
      />
      <span>{textShown}</span>
    </label>
  );
}
