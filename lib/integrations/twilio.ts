import { assertIntegrationStubAllowed } from "@/lib/integrations/stub-guard";

export const TWILIO_STUBBED = true;

export function assertTwilioStubAllowed(): void {
  assertIntegrationStubAllowed("Twilio");
}
