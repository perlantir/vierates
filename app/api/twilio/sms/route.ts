import { NextResponse } from "next/server";

import { rejectLargePayload } from "@/lib/http/request-guards";
import { IntegrationUnavailableError } from "@/lib/integrations/stub-guard";
import { assertTwilioStubAllowed } from "@/lib/integrations/twilio";
import { prisma } from "@/lib/prisma";
import { checkFixedWindowRateLimit } from "@/lib/rate-limit";
import { honorSmsStop } from "@/lib/services/notifications";

export async function POST(request: Request) {
  const payloadTooLarge = rejectLargePayload(request, 8_192);

  if (payloadTooLarge) {
    return new NextResponse("<Response></Response>", { status: 413 });
  }

  try {
    assertTwilioStubAllowed();
  } catch (error) {
    if (error instanceof IntegrationUnavailableError) {
      return new NextResponse("<Response></Response>", {
        status: error.status,
      });
    }

    throw error;
  }

  const rateLimit = await checkFixedWindowRateLimit({
    key: requestIp(request),
    limit: 120,
    prefix: "webhooks:twilio-sms",
    window: "1 m",
  });

  if (!rateLimit.success) {
    return new NextResponse("<Response></Response>", { status: 429 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return new NextResponse("<Response></Response>", { status: 400 });
  }

  const from = String(formData.get("From") ?? "");
  const body = String(formData.get("Body") ?? "");

  const result = await honorSmsStop(prisma, { body, from });

  return new NextResponse(
    result.optedOut
      ? "<Response><Message>You are opted out. Reply START to resume.</Message></Response>"
      : "<Response></Response>",
    {
      headers: {
        "content-type": "text/xml",
      },
    },
  );
}

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}
