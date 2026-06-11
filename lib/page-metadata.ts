import type { Metadata } from "next";

export function pageMetadata({
  description,
  path,
  title,
}: {
  description: string;
  path: string;
  title: string;
}): Metadata {
  return {
    alternates: {
      canonical: path,
    },
    description,
    openGraph: {
      description,
      title: `${title} — VieRates`,
      url: path,
    },
    title,
    twitter: {
      description,
      title: `${title} — VieRates`,
    },
  };
}
