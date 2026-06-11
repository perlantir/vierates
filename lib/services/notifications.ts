import type { Prisma, PrismaClient } from "@prisma/client";

import { normalizePhone } from "@/lib/borrower/wizard";
import { assertResendStubAllowed } from "@/lib/integrations/resend";
import { assertTwilioStubAllowed } from "@/lib/integrations/twilio";
import { sensitiveBlindIndex } from "@/lib/security/borrower-identity-vault";

const smsStopSuffix = "Reply STOP to opt out.";

type EmailMessage = {
  html: string;
  preheader: string;
  subject: string;
  text: string;
};

type SmsMessage = {
  body: string;
};

export const notificationTemplates = {
  borrowerConnectionDeliveredEmail(lenderName: string): EmailMessage {
    return brandedEmail({
      body: `${lenderName} received your Connect request with your logged consent. Keep one introduction active at a time from your dashboard.`,
      preheader: "Your logged-consent Connect request was delivered.",
      subject: "Your VieRates introduction was delivered",
    });
  },
  borrowerConnectionDeliveredSms(lenderName: string): SmsMessage {
    return {
      body: withSmsStop(
        `${lenderName} received your VieRates Connect request with your logged consent.`,
      ),
    };
  },
  borrowerListingLiveEmail(): EmailMessage {
    return brandedEmail({
      body: "Your listing is live. Lenders see your anonymous profile only. Your name and contact details stay hidden until you choose.",
      preheader: "Your anonymous listing is live.",
      subject: "Your anonymous VieRates listing is live",
    });
  },
  borrowerVerificationCompleteEmail(opensAt: string): EmailMessage {
    return brandedEmail({
      body: `Your Bid Room opens at ${opensAt}. Lenders see the verified masked profile you reviewed.`,
      preheader: "Your Bid Room schedule is confirmed.",
      subject: "Your VieRates Bid Room is scheduled",
    });
  },
  lenderConnectionDeliveredEmail(): EmailMessage {
    return brandedEmail({
      body: "A borrower selected your organization for a Connect introduction. The request includes timestamped consent.",
      preheader: "A borrower requested a logged-consent introduction.",
      subject: "New VieRates Connect introduction",
    });
  },
  lenderNewAuctionDigestEmail(count: number): EmailMessage {
    return brandedEmail({
      body: `${count} verified borrower profiles match your coverage box. Bid only when the fit is right.`,
      preheader: `${count} verified profiles match your coverage box.`,
      subject: "New verified auctions in your coverage box",
    });
  },
};

export async function sendNotificationEmail(
  db: PrismaClient,
  input: {
    message: EmailMessage;
    payload?: Prisma.InputJsonValue;
    template: string;
    to: string;
  },
) {
  // TODO(integration): real Resend email delivery.
  assertResendStubAllowed();
  const recipient = notificationRecipientIndex("email", input.to);

  return db.notificationLog.create({
    data: {
      channel: "EMAIL",
      payload: input.payload ?? {},
      recipient,
      status: "DEMO_SENT",
      template: input.template,
    },
  });
}

export async function sendNotificationSms(
  db: PrismaClient,
  input: {
    message: SmsMessage;
    payload?: Prisma.InputJsonValue;
    template: string;
    to: string;
  },
) {
  // TODO(integration): real Twilio SMS delivery.
  assertTwilioStubAllowed();

  const phone = normalizePhone(input.to);
  const recipient = notificationRecipientIndex("sms", phone);
  const optedOut = await db.smsOptOut.findUnique({
    where: { phone: recipient },
  });

  return db.notificationLog.create({
    data: {
      channel: "SMS",
      payload: input.payload ?? {},
      recipient,
      status: optedOut ? "SKIPPED_OPT_OUT" : "DEMO_SENT",
      template: input.template,
    },
  });
}

export async function honorSmsStop(
  db: PrismaClient,
  input: { body: string; from: string },
) {
  const normalizedBody = input.body.trim().toUpperCase();
  const phone = normalizePhone(input.from);
  const recipient = notificationRecipientIndex("sms", phone);

  if (
    !["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(
      normalizedBody,
    )
  ) {
    return { optedOut: false, phone: recipient };
  }

  await db.smsOptOut.upsert({
    create: { phone: recipient },
    update: {},
    where: { phone: recipient },
  });

  return { optedOut: true, phone: recipient };
}

export function withSmsStop(message: string): string {
  return message.endsWith(smsStopSuffix)
    ? message
    : `${message} ${smsStopSuffix}`;
}

function brandedEmail(input: {
  body: string;
  preheader: string;
  subject: string;
}): EmailMessage {
  const footer =
    "VieRates is a marketplace, not a lender. Your identity stays sealed until you choose.";

  return {
    html: [
      '<div style="display:none;max-height:0;overflow:hidden;color:transparent;">',
      escapeHtml(input.preheader),
      "</div>",
      '<main style="background:#f8f6f0;color:#102f2a;font-family:Arial,sans-serif;padding:32px;">',
      '<section style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8d2c5;padding:28px;">',
      '<p style="margin:0 0 24px;font-size:22px;font-weight:700;letter-spacing:0;">VieRates</p>',
      '<div style="height:8px;width:72px;background:#d8aa2b;margin-bottom:24px;"></div>',
      `<h1 style="font-size:24px;line-height:1.25;margin:0 0 16px;">${escapeHtml(
        input.subject,
      )}</h1>`,
      `<p style="font-size:16px;line-height:1.6;margin:0 0 24px;">${escapeHtml(
        input.body,
      )}</p>`,
      '<p style="border-top:1px solid #d8d2c5;color:#5f6f68;font-size:12px;line-height:1.5;margin:0;padding-top:16px;">',
      escapeHtml(footer),
      "</p>",
      "</section>",
      "</main>",
    ].join(""),
    preheader: input.preheader,
    subject: input.subject,
    text: `VieRates\n\n${input.body}\n\n${footer}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function notificationRecipientIndex(
  channel: "email" | "sms",
  recipient: string,
): string {
  const normalized =
    channel === "email"
      ? recipient.trim().toLowerCase()
      : normalizePhone(recipient);

  return sensitiveBlindIndex(`notification:${channel}`, normalized);
}
