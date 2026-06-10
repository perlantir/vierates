import { getEnv } from "@/lib/env";

type Surface = "marketing" | "borrower" | "lender" | "admin";

export function isDemoMode(): boolean {
  return getEnv().DEMO_MODE;
}

export function assertDemoDataAllowed(surface: Surface) {
  if (
    process.env.NODE_ENV === "production" &&
    getEnv().DEMO_MODE &&
    (surface === "borrower" || surface === "lender")
  ) {
    throw new Error(`Demo data cannot render on production ${surface} surfaces.`);
  }
}
