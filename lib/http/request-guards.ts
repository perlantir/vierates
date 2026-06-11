import { NextResponse } from "next/server";

import { checkFixedWindowRateLimit } from "@/lib/rate-limit";

const defaultMaxBodyBytes = 32_768;

export function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0"
  );
}

export function rejectLargePayload(
  request: Request,
  maxBytes = defaultMaxBodyBytes,
): NextResponse | null {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  return null;
}

export async function readJsonBody(request: Request): Promise<
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

export async function enforceRateLimit(
  request: Request,
  input: {
    key?: string;
    limit: number;
    prefix: string;
    window: `${number} ${"s" | "m" | "h" | "d"}`;
  },
): Promise<NextResponse | null> {
  const rateLimit = await checkFixedWindowRateLimit({
    key: input.key ?? requestIp(request),
    limit: input.limit,
    prefix: input.prefix,
    window: input.window,
  });

  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return null;
}
