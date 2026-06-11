import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";

import { ClientTelemetry } from "@/components/client-telemetry";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site";

import "./globals.css";

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-plex-serif",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "VieRates — Lenders compete for your mortgage. You stay anonymous.",
    template: "%s — VieRates",
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/assets/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: "VieRates sealed ledger",
        height: 630,
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: siteConfig.name,
    title: "VieRates — Lenders compete. You stay anonymous.",
    type: "website",
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    images: [absoluteUrl("/opengraph-image")],
    title: "VieRates — Lenders compete. You stay anonymous.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C2A23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="font-sans antialiased">
        <a className="vr-skip-link" href="#main-content">
          Skip to content
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            logo: absoluteUrl("/assets/logo-mark.svg"),
            name: siteConfig.name,
            url: siteConfig.url,
          }}
        />
        <ClientTelemetry />
      </body>
    </html>
  );
}
