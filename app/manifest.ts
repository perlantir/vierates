import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#F5F7F3",
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/assets/favicon.svg",
        type: "image/svg+xml",
      },
      {
        sizes: "180x180",
        src: "/apple-touch-icon.svg",
        type: "image/svg+xml",
      },
    ],
    name: siteConfig.name,
    short_name: "VieRates",
    start_url: "/",
    theme_color: "#0C2A23",
  };
}
