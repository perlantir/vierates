export class IntegrationUnavailableError extends Error {
  readonly code = "INTEGRATION_UNAVAILABLE";
  readonly status = 503;
}

export function assertIntegrationStubAllowed(name: string): void {
  if (process.env.DEMO_MODE !== "true") {
    throw new IntegrationUnavailableError(
      `${name} integration is stubbed and cannot run unless DEMO_MODE=true.`,
    );
  }
}
