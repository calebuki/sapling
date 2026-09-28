import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { IslandPack } from "./types";

// Islands load on demand: a player only downloads the language they play.
export async function loadIsland(code: TargetLanguageCode): Promise<IslandPack | null> {
  switch (code) {
    case "sv":
      return (await import("./sv")).island;
    default:
      return null;
  }
}
