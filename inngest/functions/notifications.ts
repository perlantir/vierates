import type { Prisma } from "@prisma/client";

import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import {
  notificationTemplates,
  sendNotificationEmail,
  sendNotificationSms,
} from "@/lib/services/notifications";

type NotificationEventContext = {
  event: {
    data: Record<string, unknown>;
  };
};

export const borrowerListingLiveNotification = inngest.createFunction(
  {
    id: "borrower-listing-live-notification",
    triggers: [{ event: "borrower/listing.live" }],
  },
  async ({ event }: NotificationEventContext) => {
    const message = notificationTemplates.borrowerListingLiveEmail();

    return sendNotificationEmail(prisma, {
      message,
      payload: jsonPayload(event.data),
      template: "borrower.listing_live.email",
      to: String(event.data.email),
    });
  },
);

export const borrowerConnectionDeliveredNotification = inngest.createFunction(
  {
    id: "borrower-connection-delivered-notification",
    triggers: [{ event: "borrower/connection.delivered" }],
  },
  async ({ event }: NotificationEventContext) => {
    const lenderName = String(event.data.lenderName);
    const emailMessage =
      notificationTemplates.borrowerConnectionDeliveredEmail(lenderName);
    const smsMessage =
      notificationTemplates.borrowerConnectionDeliveredSms(lenderName);

    const [emailLog, smsLog] = await Promise.all([
      sendNotificationEmail(prisma, {
        message: emailMessage,
        payload: jsonPayload(event.data),
        template: "borrower.connection_delivered.email",
        to: String(event.data.email),
      }),
      sendNotificationSms(prisma, {
        message: smsMessage,
        payload: jsonPayload(event.data),
        template: "borrower.connection_delivered.sms",
        to: String(event.data.phone),
      }),
    ]);

    return { emailLog, smsLog };
  },
);

export const borrowerVerificationCompleteNotification = inngest.createFunction(
  {
    id: "borrower-verification-complete-notification",
    triggers: [{ event: "borrower/verification.complete" }],
  },
  async ({ event }: NotificationEventContext) => {
    const message = notificationTemplates.borrowerVerificationCompleteEmail(
      String(event.data.opensAt),
    );

    return sendNotificationEmail(prisma, {
      message,
      payload: jsonPayload(event.data),
      template: "borrower.verification_complete.email",
      to: String(event.data.email),
    });
  },
);

export const lenderConnectionDeliveredNotification = inngest.createFunction(
  {
    id: "lender-connection-delivered-notification",
    triggers: [{ event: "lender/connection.delivered" }],
  },
  async ({ event }: NotificationEventContext) => {
    const message = notificationTemplates.lenderConnectionDeliveredEmail();

    return sendNotificationEmail(prisma, {
      message,
      payload: jsonPayload(event.data),
      template: "lender.connection_delivered.email",
      to: String(event.data.email),
    });
  },
);

export const lenderNewAuctionDigestNotification = inngest.createFunction(
  {
    id: "lender-new-auction-digest-notification",
    triggers: [{ event: "lender/auction.digest" }],
  },
  async ({ event }: NotificationEventContext) => {
    const message = notificationTemplates.lenderNewAuctionDigestEmail(
      Number(event.data.count ?? 0),
    );

    return sendNotificationEmail(prisma, {
      message,
      payload: jsonPayload(event.data),
      template: "lender.auction_digest.email",
      to: String(event.data.email),
    });
  },
);

export const notificationFunctions = [
  borrowerListingLiveNotification,
  borrowerConnectionDeliveredNotification,
  borrowerVerificationCompleteNotification,
  lenderConnectionDeliveredNotification,
  lenderNewAuctionDigestNotification,
];

function jsonPayload(data: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonObject;
}
