import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { publicEnv } from "@/lib/env";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
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
    default: "Sapling — Danish that takes root",
    template: "%s | Sapling",
  },
  description:
    "A personal Danish learning system built around retrieval, listening, and a growing model of what you can use.",
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
      className={`${dmSans.variable} ${fraunces.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

