import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { honorSmsStop } from "@/lib/services/notifications";

export async function POST(request: Request) {
  const formData = await request.formData();
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
