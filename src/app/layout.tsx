import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { publicEnv } from "@/lib/env";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

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
    default: "Lilla Ö — Learn Swedish on a little island",
    template: "%s | Lilla Ö",
  },
  description:
    "An immersive 3D island where everyone speaks Swedish. Meet the villagers, find words, and talk for real.",
  applicationName: "Sapling",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#cfe6ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={`${display.variable} ${body.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
