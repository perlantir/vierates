import { assertIntegrationStubAllowed } from "@/lib/integrations/stub-guard";
import { createHmac, timingSafeEqual } from "node:crypto";

import { demoRuntimeAllowed } from "@/lib/runtime-mode";

export const TWILIO_STUBBED = true;
export const TWILIO_SIGNATURE_HEADER = "x-twilio-signature";

export function assertTwilioStubAllowed(): void {
  assertIntegrationStubAllowed("Twilio");
}

export function unsignedTwilioWebhookAllowed(): boolean {
  return demoRuntimeAllowed();
}

export function verifyTwilioWebhookSignature(input: {
  params: Record<string, string>;
  signature: string | null;
  url: string;
}): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken || !input.signature) {
    return false;
  }

  const signedPayload =
    input.url +
    Object.keys(input.params)
      .sort()
      .map((key) => `${key}${input.params[key]}`)
      .join("");
  const expected = createHmac("sha1", authToken)
    .update(signedPayload)
    .digest("base64");

  return timingSafeEqualString(expected, input.signature);
}

function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
