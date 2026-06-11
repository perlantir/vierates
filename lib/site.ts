export const siteConfig = {
  description:
    "Lenders compete for your mortgage while your identity stays sealed until you choose.",
  name: "VieRates",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vierates.com",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
