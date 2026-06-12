import { execFileSync } from "node:child_process";
import { resolve4, resolve6, resolveCname } from "node:dns/promises";

type CheckStatus = "FAIL" | "PASS" | "WARN";

type CheckResult = {
  detail: string;
  name: string;
  status: CheckStatus;
};

const baseUrl =
  process.env.LAUNCH_GATE_BASE_URL ?? "https://vierates.vercel.app";
const domains = (
  process.env.LAUNCH_GATE_DOMAINS ?? "vierates.com,www.vierates.com"
)
  .split(",")
  .map((domain) => domain.trim())
  .filter(Boolean);
const vercelArgs = process.env.LAUNCH_GATE_VERCEL_SCOPE
  ? ["env", "ls", "--scope", process.env.LAUNCH_GATE_VERCEL_SCOPE]
  : ["env", "ls"];

const liveRoutes = [
  "/",
  "/lenders",
  "/app/lenders",
  "/bid-index",
  "/legal/privacy",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
] as const;

const requiredProductionEnv = [
  "ARRAY_API_KEY",
  "ATTOM_KEY",
  "BORROWER_IDENTITY_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "DATABASE_URL",
  "DEMO_MODE",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "PERSONA_API_KEY",
  "POSTHOG_KEY",
  "PUSHER_APP_ID",
  "PUSHER_CLUSTER",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "SENTRY_DSN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "TRUV_CLIENT_ID",
  "TRUV_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID",
  "UPSTASH_REDIS_REST_TOKEN",
  "UPSTASH_REDIS_REST_URL",
] as const;

const results: CheckResult[] = [];
const vercelDnsApexIp = "76.76.21.21";

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  await checkLiveRoutes();
  await checkLiveHeaders();
  await checkCustomDomainDns();
  checkVercelProductionEnvNames();
  printResults();

  if (results.some((result) => result.status === "FAIL")) {
    process.exit(1);
  }
}

async function checkLiveRoutes() {
  for (const route of liveRoutes) {
    try {
      const response = await fetch(new URL(route, baseUrl));
      const body =
        route === "/lenders" || route === "/app/lenders"
          ? await response.text()
          : "";
      const rawJsonError =
        body.trimStart().startsWith('{"error"') ||
        body.includes("Authentication is not configured");

      addResult({
        detail: `${response.status} ${new URL(route, baseUrl).toString()}`,
        name: `live route ${route}`,
        status: response.ok && !rawJsonError ? "PASS" : "FAIL",
      });
    } catch (error) {
      addResult({
        detail: error instanceof Error ? error.message : String(error),
        name: `live route ${route}`,
        status: "FAIL",
      });
    }
  }
}

async function checkLiveHeaders() {
  try {
    const response = await fetch(baseUrl);
    const csp = response.headers.get("content-security-policy") ?? "";
    const scriptPolicy = csp.match(/script-src[^;]*/)?.[0] ?? "";
    const hsts = response.headers.get("strict-transport-security") ?? "";
    const frame = response.headers.get("x-frame-options") ?? "";
    const contentType = response.headers.get("x-content-type-options") ?? "";
    const referrer = response.headers.get("referrer-policy") ?? "";
    const html = await response.text();
    const fontPreloadCount = (
      html.match(/rel="preload"[^>]*as="font"|as="font"[^>]*rel="preload"/g) ??
      []
    ).length;
    const scriptPolicyOk =
      scriptPolicy.includes("'nonce-") &&
      scriptPolicy.includes("'strict-dynamic'") &&
      !scriptPolicy.includes("'unsafe-inline'") &&
      !scriptPolicy.includes("'unsafe-eval'");

    addResult({
      detail: scriptPolicy,
      name: "live CSP script policy",
      status: scriptPolicyOk ? "PASS" : "FAIL",
    });
    addResult({
      detail: `HSTS=${Boolean(hsts)} XFO=${frame || "missing"} XCTO=${
        contentType || "missing"
      } Referrer=${referrer || "missing"}`,
      name: "live security headers",
      status:
        hsts &&
        frame.toUpperCase() === "DENY" &&
        contentType.toLowerCase() === "nosniff" &&
        Boolean(referrer)
          ? "PASS"
          : "FAIL",
    });
    addResult({
      detail: `${fontPreloadCount} font preloads`,
      name: "live font preload budget",
      status: fontPreloadCount <= 2 ? "PASS" : "FAIL",
    });
  } catch (error) {
    addResult({
      detail: error instanceof Error ? error.message : String(error),
      name: "live headers",
      status: "FAIL",
    });
  }
}

async function checkCustomDomainDns() {
  for (const domain of domains) {
    const records = await resolveDomain(domain);

    addResult({
      detail: records.length
        ? records.join(", ")
        : `no public DNS records; add A ${domain} ${vercelDnsApexIp} at the registrar or use ns1.vercel-dns.com / ns2.vercel-dns.com`,
      name: `custom-domain DNS ${domain}`,
      status: records.length ? "PASS" : "FAIL",
    });
  }
}

function checkVercelProductionEnvNames() {
  let output: string;

  try {
    output = execFileSync("vercel", vercelArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    addResult({
      detail:
        error instanceof Error
          ? `${error.message}; set LAUNCH_GATE_VERCEL_SCOPE if needed`
          : String(error),
      name: "Vercel production env names",
      status: "WARN",
    });
    return;
  }

  const envRows = parseVercelEnvRows(output);
  const missing = requiredProductionEnv.filter(
    (name) => !envRows.some((row) => row.name === name && row.production),
  );

  addResult({
    detail: missing.length
      ? `missing: ${missing.join(
          ", ",
        )}; add with "vercel env add <NAME> production" and redeploy; DEMO_MODE must be false in Production`
      : "all present",
    name: "Vercel production env names",
    status: missing.length ? "FAIL" : "PASS",
  });
}

async function resolveDomain(domain: string): Promise<string[]> {
  const records = new Set<string>();

  for (const resolver of [resolve4, resolve6, resolveCname]) {
    try {
      for (const record of await resolver(domain)) {
        records.add(record);
      }
    } catch {
      // Try the next record type; absence of one type does not fail the domain.
    }
  }

  return [...records].sort();
}

function parseVercelEnvRows(output: string) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("name "))
    .map((line) => {
      const [name = "", ...rest] = line.split(/\s+/);
      return {
        name,
        production: rest.join(" ").includes("Production"),
      };
    })
    .filter((row) => row.name && row.name !== "value");
}

function addResult(result: CheckResult) {
  results.push(result);
}

function printResults() {
  const order: Record<CheckStatus, number> = { FAIL: 0, WARN: 1, PASS: 2 };

  console.log("\nVieRates launch gate\n");
  for (const result of [...results].sort(
    (a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name),
  )) {
    console.log(`[${result.status}] ${result.name}`);
    console.log(`       ${result.detail}`);
  }

  const failures = results.filter((result) => result.status === "FAIL").length;
  const warnings = results.filter((result) => result.status === "WARN").length;

  console.log(
    `\nSummary: ${failures} failed, ${warnings} warnings, ${
      results.length - failures - warnings
    } passed.`,
  );
}
