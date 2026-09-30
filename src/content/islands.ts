import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { IslandPack } from "./types";

// Islands load on demand: a player only downloads the language they play.
export async function loadIsland(code: TargetLanguageCode): Promise<IslandPack | null> {
  switch (code) {
    case "sv":
      return (await import("./sv")).island;
    case "de":
      return (await import("./de")).island;
    case "vi":
      return (await import("./vi")).island;
    default:
      return null;
  }
}
