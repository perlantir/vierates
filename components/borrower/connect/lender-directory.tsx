"use client";

import { useMemo, useState } from "react";

import { LenderCard } from "@/components/lender-card";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { consentTextForParty } from "@/lib/consent/text";

export type DirectoryConnection = {
  createdAt: string;
  id: string;
  lenderName: string;
  nmlsId: string;
  status: string;
};

export type DirectoryLender = {
  avgResponseTime: string;
  id: string;
  legalName: string;
  nmlsId: string;
  rating: string;
  specialties: string[];
  statesLicensed: string[];
};

export type DirectoryListing = {
  connections: DirectoryConnection[];
  id: string;
  loanAmount: number;
  purpose: string;
  state: string;
};

type LenderDirectoryProps = {
  lenders: DirectoryLender[];
  listing?: DirectoryListing | null;
};

const activeStatuses = new Set(["REQUESTED", "DELIVERED", "CONTACTED"]);

export function LenderDirectory({ lenders, listing }: LenderDirectoryProps) {
  const [stateFilter, setStateFilter] = useState(listing?.state ?? "ALL");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [selectedLender, setSelectedLender] = useState<DirectoryLender>();
  const [consentHash, setConsentHash] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [activeConnection, setActiveConnection] = useState<
    DirectoryConnection | undefined
  >(() =>
    listing?.connections.find((connection) =>
      activeStatuses.has(connection.status),
    ),
  );
  const [isBusy, setIsBusy] = useState(false);

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(lenders.flatMap((lender) => lender.specialties)),
      ).sort(),
    [lenders],
  );

  const filteredLenders = useMemo(
    () =>
      lenders.filter((lender) => {
        const stateMatches =
          stateFilter === "ALL" || lender.statesLicensed.includes(stateFilter);
        const specialtyMatches =
          specialtyFilter === "ALL" ||
          lender.specialties.includes(specialtyFilter);

        return stateMatches && specialtyMatches;
      }),
    [lenders, specialtyFilter, stateFilter],
  );

  async function requestConnection() {
    if (!selectedLender || !listing || !consentHash) {
      return;
    }

    setIsBusy(true);
    setMessage(undefined);

    const idempotencyKey = `connect:${listing.id}:${selectedLender.id}`;
    const response = await fetch("/api/borrower/connections", {
      body: JSON.stringify({
        consentTextShown: consentTextForParty(selectedLender.legalName),
        idempotencyKey,
        lenderOrgId: selectedLender.id,
        listingId: listing.id,
        textShownSha256: consentHash,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      id?: string;
      status?: string;
    };

    setIsBusy(false);

    if (!response.ok || !result.id || !result.status) {
      setMessage(result.error ?? "Introduction could not be requested.");
      return;
    }

    setActiveConnection({
      createdAt: new Date().toISOString(),
      id: result.id,
      lenderName: selectedLender.legalName,
      nmlsId: selectedLender.nmlsId,
      status: result.status,
    });
    setSelectedLender(undefined);
    setConsentHash(undefined);
    setMessage("Introduction delivered.");
  }

  async function closeConnection() {
    if (!activeConnection) {
      return;
    }

    setIsBusy(true);
    setMessage(undefined);

    const response = await fetch(
      `/api/borrower/connections/${activeConnection.id}/close`,
      { method: "POST" },
    );

    setIsBusy(false);

    if (!response.ok) {
      setMessage("Introduction could not be closed.");
      return;
    }

    setActiveConnection(undefined);
    setMessage("Introduction closed. You can pick another lender.");
  }

  return (
    <main className="vr-section min-h-screen bg-paper">
      <div className="vr-frame grid gap-6">
        <header className="border-b border-line pb-6">
          <h1 className="font-sans text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Lender directory
          </h1>
          <p className="mt-3 max-w-2xl text-text-muted">
            Request one introduction at a time. Each request names the lender
            and records your consent.
          </p>
        </header>

        {!listing ? (
          <section className="vr-card flex flex-col justify-between gap-4 border-info bg-info-tint p-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-sans text-2xl font-semibold text-ink">
                Browse first. Request later.
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                You can review approved lenders now. Start an anonymous listing
                when you are ready to request an introduction.
              </p>
            </div>
            <Button href="/app/new">Start my listing</Button>
          </section>
        ) : null}

        {activeConnection ? (
          <section className="vr-card flex flex-col justify-between gap-4 border-verified p-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-sans text-2xl font-semibold text-ink">
                Active introduction
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                {activeConnection.lenderName} · NMLS {activeConnection.nmlsId} ·{" "}
                {humanize(activeConnection.status)}
              </p>
            </div>
            <Button
              disabled={isBusy}
              onClick={() => void closeConnection()}
              variant="secondary"
            >
              Close and pick another
            </Button>
          </section>
        ) : null}

        <section className="vr-card grid gap-4 p-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            State
            <select
              className="min-h-11 rounded-ui border border-line bg-card px-3 text-base font-normal"
              onChange={(event) => setStateFilter(event.target.value)}
              value={stateFilter}
            >
              <option value="ALL">All states</option>
              {Array.from(
                new Set(lenders.flatMap((lender) => lender.statesLicensed)),
              )
                .sort()
                .map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Specialty
            <select
              className="min-h-11 rounded-ui border border-line bg-card px-3 text-base font-normal"
              onChange={(event) => setSpecialtyFilter(event.target.value)}
              value={specialtyFilter}
            >
              <option value="ALL">All specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLenders.map((lender) => (
            <div
              className="grid gap-3"
              data-testid={`lender-option-${lender.id}`}
              key={lender.id}
            >
              <LenderCard
                legalName={lender.legalName}
                nmlsId={lender.nmlsId}
                rating={lender.rating}
                responseTime={lender.avgResponseTime}
                specialties={lender.specialties}
              />
              <Button
                disabled={!listing || Boolean(activeConnection)}
                onClick={() => {
                  setSelectedLender(lender);
                  setConsentHash(undefined);
                  setMessage(undefined);
                }}
                variant="secondary"
              >
                {listing ? "Request introduction" : "Start listing to request"}
              </Button>
            </div>
          ))}
        </section>

        {selectedLender && !activeConnection ? (
          <section
            className="vr-card grid gap-4 p-5"
            data-testid="connect-consent"
          >
            <div>
              <h2 className="font-sans text-2xl font-semibold text-ink">
                Confirm introduction
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Only {selectedLender.legalName} receives your contact details
                for this Connect request.
              </p>
            </div>
            <ConsentCheckbox
              onConsent={({ textShownSha256 }) =>
                setConsentHash(textShownSha256)
              }
              partyName={selectedLender.legalName}
            />
            <Button
              disabled={!consentHash || isBusy}
              onClick={() => void requestConnection()}
            >
              Request introduction
            </Button>
          </section>
        ) : null}

        <section className="vr-card p-5">
          <h2 className="font-sans text-2xl font-semibold text-ink">
            Timeline
          </h2>
          <ol className="mt-5 grid gap-3">
            <TimelineRow active label="Requested" />
            <TimelineRow active={Boolean(activeConnection)} label="Delivered" />
            <TimelineRow active={false} label="They reached out" />
          </ol>
        </section>

        {message ? (
          <p className="rounded-ui border border-line bg-card p-3 text-sm text-text-muted">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function TimelineRow({ active, label }: { active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={[
          "h-3 w-3 rounded-full border",
          active ? "border-verified bg-verified" : "border-line bg-card",
        ].join(" ")}
      />
      <span className="text-sm font-semibold text-ink">{label}</span>
    </li>
  );
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
