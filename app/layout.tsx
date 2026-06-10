import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Inter } from "next/font/google";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "VieRates",
  description: "Anonymous mortgage bidding marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
