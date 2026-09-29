import type { TargetLanguageCode } from "@/lib/learning/languages";

// How Gemini should sound for each island. Shared by /api/speech and the
// pre-generation script so a clip sounds the same however it was made.
const direction: Record<TargetLanguageCode, { everyday: string; slow: string }> = {
  sv: {
    everyday:
      "You are a native Swedish speaker from Stockholm chatting with a friend on a small island. Speak natural, relaxed, everyday rikssvenska with warm, lively intonation, natural rhythm and the usual Swedish pitch accent. Never sound like you are reading aloud.",
    slow: "You are a friendly native Swedish speaker from Stockholm helping a beginner. Speak slowly and clearly, pronouncing every word fully with natural Swedish intonation and pitch accent, like a patient teacher, not a robot.",
  },
  de: {
    everyday:
      "You are a native German speaker from the Black Forest in southern Germany chatting with a friend in your village. Speak natural, relaxed, everyday standard German (Hochdeutsch) with a warm, friendly southern lilt and natural rhythm, not a heavy dialect. Never sound like you are reading aloud.",
    slow: "You are a friendly native German speaker helping a beginner. Speak slowly and clearly in standard German, pronouncing every word and ending fully with natural intonation, like a patient teacher, not a robot.",
  },
  da: {
    everyday:
      "You are a native Danish speaker from Copenhagen chatting with a friend. Speak natural, relaxed, everyday Danish with warm intonation and natural rhythm. Never sound like you are reading aloud.",
    slow: "You are a friendly native Danish speaker helping a beginner. Speak slowly and clearly with natural Danish intonation, like a patient teacher, not a robot.",
  },
};

export function speechDirection(language: TargetLanguageCode, slow: boolean) {
  return slow ? direction[language].slow : direction[language].everyday;
}
