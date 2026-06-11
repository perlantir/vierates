import { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import {
  honorSmsStop,
  notificationRecipientIndex,
  notificationTemplates,
  sendNotificationSms,
} from "../lib/services/notifications";
import { setValidTestEnv } from "./helpers/env";

setValidTestEnv();

const prisma = new PrismaClient();
const testPhone = "3125558811";

describe("notifications", () => {
  beforeEach(async () => {
    const recipient = notificationRecipientIndex("sms", testPhone);

    await prisma.notificationLog.deleteMany({
      where: { recipient: { in: [recipient, testPhone] } },
    });
    await prisma.smsOptOut.deleteMany({
      where: { phone: { in: [recipient, testPhone] } },
    });
  });

  it("keeps borrower SMS copy opted-out compliant", () => {
    const sms =
      notificationTemplates.borrowerConnectionDeliveredSms("Prairie Home");

    expect(sms.body).toMatch(/Reply STOP to opt out\.$/);
  });

  it("keeps email templates branded for inbox delivery", () => {
    const email = notificationTemplates.borrowerListingLiveEmail();

    expect(email.preheader).toContain("anonymous listing");
    expect(email.text).toContain("VieRates");
    expect(email.text).toContain("marketplace, not a lender");
    expect(email.html).toContain("VieRates");
    expect(email.html).toContain("#d8aa2b");
  });

  it("honors STOP before logging a demo SMS send", async () => {
    const stopResult = await honorSmsStop(prisma, {
      body: "STOP",
      from: testPhone,
    });
    const recipient = notificationRecipientIndex("sms", testPhone);

    expect(stopResult.optedOut).toBe(true);
    expect(stopResult.phone).toBe(recipient);

    const log = await sendNotificationSms(prisma, {
      message:
        notificationTemplates.borrowerConnectionDeliveredSms("Prairie Home"),
      template: "borrower.connection_delivered.sms",
      to: testPhone,
    });

    expect(log.status).toBe("SKIPPED_OPT_OUT");
    expect(log.recipient).toBe(recipient);
    expect(log.recipient).not.toBe(testPhone);
    await expect(
      prisma.smsOptOut.findUnique({ where: { phone: recipient } }),
    ).resolves.toBeTruthy();
    await expect(
      prisma.smsOptOut.findUnique({ where: { phone: testPhone } }),
    ).resolves.toBeNull();
  });
});
