import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const icon = await readFile(join(process.cwd(), "public/assets/favicon.svg"));

  return new Response(icon, {
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": "image/svg+xml",
    },
  });
}
