import type { TargetLanguageCode } from "@/lib/learning/languages";

// What the hub shows about each island before any of it is downloaded.
export type IslandMeta = {
  code: TargetLanguageCode;
  island: string;
  islandEn: string;
  blurb: string;
  // Colours for the island's postcard on the hub.
  art: "lilla-o" | "tannenau" | "soon";
  accent: string;
  accentEdge: string;
};

export const islandMeta: IslandMeta[] = [
  {
    code: "sv",
    island: "Lilla Ö",
    islandEn: "Little Island",
    blurb: "A skerry of falu-red cottages. Order fika from Bosse, count the catch with Nils, shop at Maja's and hear old stories at the lighthouse.",
    art: "lilla-o",
    accent: "#3f7fd1",
    accentEdge: "#2b5a9a",
  },
  {
    code: "de",
    island: "Tannenau",
    islandEn: "Fir Island",
    blurb: "A Black Forest village on a mountain lake. Buy pretzels at the bakery, fix cuckoo clocks and hike through the firs.",
    art: "tannenau",
    accent: "#2f7d4f",
    accentEdge: "#1f5a37",
  },
  {
    code: "da",
    island: "Coming soon",
    islandEn: "Danish",
    blurb: "A Danish island is on the way. Its first lessons are already written; the villagers are still packing.",
    art: "soon",
    accent: "#c8102e",
    accentEdge: "#8f0b20",
  },
];
