import type { Villager } from "@/lib/game/villagers";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { villagers as de } from "./de/villagers";
import { villagers as sv } from "./sv/villagers";
import { villagers as vi } from "./vi/villagers";

// Every island's people, for server routes that write their lines.
const byLanguage: Partial<Record<TargetLanguageCode, Villager[]>> = { de, sv, vi };

export function findVillager(languageCode: TargetLanguageCode, id: string) {
  return byLanguage[languageCode]?.find((villager) => villager.id === id) ?? null;
}
