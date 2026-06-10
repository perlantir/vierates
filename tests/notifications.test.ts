import { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import {
  honorSmsStop,
  notificationTemplates,
  sendNotificationSms,
} from "../lib/services/notifications";

process.env.DATABASE_URL ??=
  "postgresql://vierates:vierates@localhost:54329/vierates?schema=public";

const prisma = new PrismaClient();
const testPhone = "3125558811";

describe("notifications", () => {
  beforeEach(async () => {
    await prisma.notificationLog.deleteMany({
      where: { recipient: testPhone },
    });
    await prisma.smsOptOut.deleteMany({
      where: { phone: testPhone },
    });
  });

  it("keeps borrower SMS copy opted-out compliant", () => {
    const sms =
      notificationTemplates.borrowerConnectionDeliveredSms("Prairie Home");

    expect(sms.body).toMatch(/Reply STOP to opt out\.$/);
  });

  it("honors STOP before logging a demo SMS send", async () => {
    const stopResult = await honorSmsStop(prisma, {
      body: "STOP",
      from: testPhone,
    });
    expect(stopResult.optedOut).toBe(true);

    const log = await sendNotificationSms(prisma, {
      message:
        notificationTemplates.borrowerConnectionDeliveredSms("Prairie Home"),
      template: "borrower.connection_delivered.sms",
      to: testPhone,
    });

    expect(log.status).toBe("SKIPPED_OPT_OUT");
  });
});
