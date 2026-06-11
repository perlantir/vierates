export function assertIntegrationStubAllowed(name: string): void {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error(
      `${name} integration is stubbed and cannot run unless DEMO_MODE=true.`,
    );
  }
}
