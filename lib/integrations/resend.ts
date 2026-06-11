import { assertIntegrationStubAllowed } from "@/lib/integrations/stub-guard";

export const RESEND_STUBBED = true;

export function assertResendStubAllowed(): void {
  assertIntegrationStubAllowed("Resend");
}
