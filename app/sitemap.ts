import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

const publicRoutes = [
  "",
  "/how-it-works",
  "/lenders",
  "/bid-index",
  "/bid-index/2026-w24",
  "/trust",
  "/about",
  "/waitlist",
  "/legal/privacy",
  "/legal/terms",
  "/legal/consent",
  "/legal/licenses",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    changeFrequency: route === "/bid-index" ? "weekly" : "monthly",
    lastModified: new Date("2026-06-11"),
    priority: route === "" ? 1 : route === "/bid-index" ? 0.8 : 0.6,
    url: absoluteUrl(route || "/"),
  }));
}
