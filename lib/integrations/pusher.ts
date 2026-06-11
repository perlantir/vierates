import { assertIntegrationStubAllowed } from "@/lib/integrations/stub-guard";

export const PUSHER_STUBBED = true;

export function assertPusherStubAllowed(): void {
  assertIntegrationStubAllowed("Pusher");
}
