import type { Prisma, PrismaClient } from "@prisma/client";

import { normalizePhone } from "@/lib/borrower/wizard";
import { assertResendStubAllowed } from "@/lib/integrations/resend";
import { assertTwilioStubAllowed } from "@/lib/integrations/twilio";
import { sensitiveBlindIndex } from "@/lib/security/borrower-identity-vault";

const smsStopSuffix = "Reply STOP to opt out.";

type EmailMessage = {
  subject: string;
  text: string;
};

type SmsMessage = {
  body: string;
};

export const notificationTemplates = {
  borrowerConnectionDeliveredEmail(lenderName: string): EmailMessage {
    return {
      subject: "Your VieRates introduction was delivered",
      text: `${lenderName} received your Connect request with your logged consent. Keep one introduction active at a time from your dashboard.`,
    };
  },
  borrowerConnectionDeliveredSms(lenderName: string): SmsMessage {
    return {
      body: withSmsStop(
        `${lenderName} received your VieRates Connect request with your logged consent.`,
      ),
    };
  },
  borrowerListingLiveEmail(): EmailMessage {
    return {
      subject: "Your anonymous VieRates listing is live",
      text: "Your listing is live. Lenders see your anonymous profile only. Your name and contact details stay hidden until you choose.",
    };
  },
  borrowerVerificationCompleteEmail(opensAt: string): EmailMessage {
    return {
      subject: "Your VieRates Bid Room is scheduled",
      text: `Your Bid Room opens at ${opensAt}. Lenders see the verified masked profile you reviewed.`,
    };
  },
  lenderConnectionDeliveredEmail(): EmailMessage {
    return {
      subject: "New VieRates Connect introduction",
      text: "A borrower selected your organization for a Connect introduction. The request includes timestamped consent.",
    };
  },
  lenderNewAuctionDigestEmail(count: number): EmailMessage {
    return {
      subject: "New verified auctions in your coverage box",
      text: `${count} verified borrower profiles match your coverage box. Bid only when the fit is right.`,
    };
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
