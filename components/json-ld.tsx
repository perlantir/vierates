import { headers } from "next/headers";

type JsonLdProps = {
  data: Record<string, unknown>;
};

export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      nonce={nonce}
      type="application/ld+json"
    />
  );
}
