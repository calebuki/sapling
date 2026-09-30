import * as da from "@/content/da/scenarios";
import * as de from "@/content/de/scenarios";
import * as sv from "@/content/sv/scenarios";
import * as vi from "@/content/vi/scenarios";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { PracticeCharacter, PracticeScenario } from "@/types/practice";

// Conversation scenarios for every language. They are small, so server routes
// and the game share this one registry.
const packs: Record<TargetLanguageCode, { characters: PracticeCharacter[]; scenarios: PracticeScenario[] }> = { da, de, sv, vi };

const characters = Object.values(packs).flatMap((pack) => pack.characters);

export function getPracticeCharacter(characterId: string): PracticeCharacter {
  return characters.find((character) => character.id === characterId) ?? characters[0];
}

export function getPracticeScenarios(languageCode: TargetLanguageCode) {
  return packs[languageCode].scenarios;
}

export function getPracticeScenario(
  languageCode: TargetLanguageCode,
  scenarioId: string,
) {
  return packs[languageCode].scenarios.find((scenario) => scenario.id === scenarioId);
}
