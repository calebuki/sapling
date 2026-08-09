import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { publicEnv } from "@/lib/env";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

function getMetadataBase() {
  try {
    return new URL(publicEnv.siteUrl);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Sapling — Languages that take root",
    template: "%s | Sapling",
  },
  description:
    "A personal language learning system built around retrieval, listening, and a growing model of what you can use.",
  applicationName: "Sapling",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
