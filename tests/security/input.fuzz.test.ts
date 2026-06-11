import { PrismaClient } from "@prisma/client";
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { notificationRecipientIndex } from "../../lib/services/notifications";
import { resetDemoRateLimits } from "../../lib/rate-limit";
import { setValidTestEnv } from "../helpers/env";

setValidTestEnv();

const prisma = new PrismaClient();

describe("security: input and mass-assignment fuzz", () => {
  beforeEach(() => {
    setValidTestEnv();
    resetDemoRateLimits();
  });

  it("rejects malformed API payloads", async () => {
    const response = await postWaitlist(
      new Request("http://localhost/api/waitlist", {
        body: JSON.stringify({
          email: "not-an-email",
          source: "x".repeat(200),
        }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 instead of 500 for malformed JSON", async () => {
    const response = await postWaitlist(
      new Request("http://localhost/api/waitlist", {
        body: "{",
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects oversized public payloads before parsing", async () => {
    const response = await postWaitlist(
      new Request("http://localhost/api/waitlist", {
        body: JSON.stringify({ email: "large@example.com" }),
        headers: {
          "content-length": "9000",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(413);
  });

  it("rate limits unauthenticated listing creation", async () => {
    let response: Response | undefined;

    for (let index = 0; index < 21; index += 1) {
      response = await postListing(
        new Request("http://localhost/api/borrower/listings", {
          body: JSON.stringify({}),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "203.0.113.99",
          },
          method: "POST",
        }),
      );
    }

    expect(response?.status).toBe(429);
  });

  it("strips contact and address residue from borrower wizard drafts", async () => {
    const response = await postWizardDraft(
      new Request("http://localhost/api/borrower/wizard-draft", {
        body: JSON.stringify({
          data: {
            address: "123 Sensitive St",
            balanceAmount: 320000,
            challengeId: "otp-secret",
            phone: "3125551212",
            purpose: "REFINANCE",
            state: "IL",
          },
          email: "borrower@example.com",
          phone: "3125551212",
          state: "IL",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { resumeToken: string };
    const draft = await prisma.listingDraft.findUniqueOrThrow({
      where: { resumeToken: body.resumeToken },
    });
    const draftData = draft.data as Record<string, unknown>;

    expect(draft.phone).toBeNull();
    expect(draft.email).toBeNull();
    expect(draftData.address).toBeUndefined();
    expect(draftData.challengeId).toBeUndefined();
    expect(draftData.phone).toBeUndefined();
    expect(draftData.purpose).toBe("REFINANCE");
  });

  it("allowlists public funnel metadata before analytics storage", async () => {
    const sessionId = `security-${Date.now()}`;
    const response = await postFunnelEvent(
      new Request("http://localhost/api/analytics/funnel", {
        body: JSON.stringify({
          event: "wizard_step_completed",
          metadata: {
            address: "123 Sensitive St",
            email: "borrower@example.com",
            field: "purpose",
            phone: "3125551212",
            propertyMatchOk: true,
          },
          sessionId,
          step: "property",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const event = await prisma.funnelEvent.findFirstOrThrow({
      orderBy: { createdAt: "desc" },
      where: { sessionId },
    });
    const metadata = event.metadata as Record<string, unknown>;

    expect(metadata.address).toBeUndefined();
    expect(metadata.email).toBeUndefined();
    expect(metadata.phone).toBeUndefined();
    expect(metadata.field).toBe("purpose");
    expect(metadata.propertyMatchOk).toBe(true);
  });

  it("keeps unsigned Stripe webhooks fail-closed without Upstash", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const response = await postStripeWebhook(
      new Request("http://localhost/api/stripe/webhook", {
        body: "{}",
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("fails protected lender routes closed before parsing attacker bodies", async () => {
    process.env.DEMO_MODE = "false";

    const boardResponse = await getLenderBoard();
    const bidResponse = await postLenderBid(
      new Request("http://localhost/api/lender/bids", {
        body: "{",
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(boardResponse.status).toBe(401);
    expect(bidResponse.status).toBe(401);
  });

  it("rejects unsigned Twilio SMS webhooks outside demo mode", async () => {
    process.env.DEMO_MODE = "false";

    const smsResponse = await postTwilioSms(
      new Request("http://localhost/api/twilio/sms", {
        body: new URLSearchParams({ Body: "STOP", From: "+13125550123" }),
        method: "POST",
      }),
    );

    expect(smsResponse.status).toBe(401);
  });

  it("accepts signed Twilio STOP webhooks and stores only a recipient index", async () => {
    process.env.DEMO_MODE = "false";
    const params = new URLSearchParams({
      Body: "STOP",
      From: "+13125550123",
    });
    const url = "https://vierates.example/api/twilio/sms";
    const signature = signTwilioRequest(url, Object.fromEntries(params));
    const response = await postTwilioSms(
      new Request(url, {
        body: params,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-twilio-signature": signature,
        },
        method: "POST",
      }),
    );
    const recipient = notificationRecipientIndex("sms", "3125550123");

    expect(response.status).toBe(200);
    await expect(
      prisma.smsOptOut.findUnique({ where: { phone: recipient } }),
    ).resolves.toBeTruthy();
    await expect(
      prisma.smsOptOut.findUnique({ where: { phone: "3125550123" } }),
    ).resolves.toBeNull();
  });

  it("returns 503 instead of 500 when OTP delivery is not configured", async () => {
    process.env.DEMO_MODE = "false";
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.POSTHOG_KEY;

    const otpResponse = await postOtpStart(
      new Request("http://localhost/api/borrower/otp/start", {
        body: JSON.stringify({ phone: uniquePhone() }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(otpResponse.status).toBe(503);
  });

  it("ignores client-supplied lender status and wallet balance", async () => {
    const suffix = String(Date.now()).slice(-7);
    const nmlsId = `1${suffix}`;
    const response = await postLenderOnboarding(
      new Request("http://localhost/api/lender/onboarding", {
        body: JSON.stringify({
          coverage: {
            ficoMin: 660,
            loanMax: 900000,
            loanMin: 150000,
            ltvMaxBp: 8500,
            products: ["30Y_FIXED"],
            purposes: ["REFINANCE"],
            states: ["IL"],
          },
          legalName: "Mass Assignment Lending",
          nmlsId,
          orgAdminEmail: `mass-${suffix}@example.com`,
          plan: "PRO",
          statesLicensed: ["IL"],
          status: "APPROVED",
          wallet: { balance: 9999 },
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const org = await prisma.lenderOrg.findUnique({
      include: { wallet: true },
      where: { nmlsId },
    });

    expect(org?.status).toBe("PENDING");
    expect(org?.wallet?.balance).toBe(0);
  });

  it("does not let public onboarding rewrite an existing lender org by NMLS", async () => {
    const suffix = String(Date.now()).slice(-7);
    const nmlsId = `8${suffix}`;
    const org = await prisma.lenderOrg.create({
      data: {
        legalName: "Protected Approved Lending",
        nmlsId,
        statesLicensed: ["IL"],
        status: "APPROVED",
      },
    });

    const response = await postLenderOnboarding(
      new Request("http://localhost/api/lender/onboarding", {
        body: JSON.stringify({
          coverage: {
            ficoMin: 660,
            loanMax: 900000,
            loanMin: 150000,
            ltvMaxBp: 8500,
            products: ["30Y_FIXED"],
            purposes: ["REFINANCE"],
            states: ["CA"],
          },
          legalName: "Attacker Rewrite Lending",
          nmlsId,
          orgAdminEmail: `rewrite-${suffix}@example.com`,
          plan: "PRO",
          statesLicensed: ["CA"],
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const unchanged = await prisma.lenderOrg.findUniqueOrThrow({
      where: { id: org.id },
    });

    expect(response.status).toBe(409);
    expect(unchanged.legalName).toBe("Protected Approved Lending");
    expect(unchanged.status).toBe("APPROVED");
    expect(unchanged.statesLicensed).toEqual(["IL"]);
  });
});

function uniquePhone(): string {
  const suffix = String(Date.now()).slice(-7);
  return `312${suffix}`;
}

function signTwilioRequest(
  url: string,
  params: Record<string, string>,
): string {
  const payload =
    url +
    Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join("");

  return createHmac("sha1", process.env.TWILIO_AUTH_TOKEN ?? "")
    .update(payload)
    .digest("base64");
}

async function getLenderBoard(): Promise<Response> {
  const route = await import("../../app/api/lender/board/route");
  return route.GET();
}

async function postFunnelEvent(request: Request): Promise<Response> {
  const route = await import("../../app/api/analytics/funnel/route");
  return route.POST(request);
}

async function postLenderBid(request: Request): Promise<Response> {
  const route = await import("../../app/api/lender/bids/route");
  return route.POST(request);
}

async function postLenderOnboarding(request: Request): Promise<Response> {
  const route = await import("../../app/api/lender/onboarding/route");
  return route.POST(request);
}

async function postListing(request: Request): Promise<Response> {
  const route = await import("../../app/api/borrower/listings/route");
  return route.POST(request);
}

async function postOtpStart(request: Request): Promise<Response> {
  const route = await import("../../app/api/borrower/otp/start/route");
  return route.POST(request);
}

async function postStripeWebhook(request: Request): Promise<Response> {
  const route = await import("../../app/api/stripe/webhook/route");
  return route.POST(request);
}

async function postTwilioSms(request: Request): Promise<Response> {
  const route = await import("../../app/api/twilio/sms/route");
  return route.POST(request);
}

async function postWaitlist(request: Request): Promise<Response> {
  const route = await import("../../app/api/waitlist/route");
  return route.POST(request);
}

async function postWizardDraft(request: Request): Promise<Response> {
  const route = await import("../../app/api/borrower/wizard-draft/route");
  return route.POST(request);
}
