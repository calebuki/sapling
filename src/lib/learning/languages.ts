export const supportedLanguageCodes = ["sv", "de", "da"] as const;

export type TargetLanguageCode = (typeof supportedLanguageCodes)[number];

export type TargetLanguage = {
  code: TargetLanguageCode;
  locale: "da-DK" | "sv-SE" | "de-DE";
  name: "Danish" | "Swedish" | "German";
  endonym: "Dansk" | "Svenska" | "Deutsch";
  audioDirectory: "danish" | "swedish" | "german";
  speakPrompt: string;
  // Letters an English keyboard lacks, offered as buttons under answer fields.
  letters: string[];
  // Whether the island is playable yet; the hub shows the rest as coming soon.
  playable: boolean;
};

export const targetLanguages: Record<TargetLanguageCode, TargetLanguage> = {
  sv: {
    code: "sv",
    locale: "sv-SE",
    name: "Swedish",
    endonym: "Svenska",
    audioDirectory: "swedish",
    speakPrompt: "Säg meningen…",
    letters: ["å", "ä", "ö"],
    playable: true,
  },
  de: {
    code: "de",
    locale: "de-DE",
    name: "German",
    endonym: "Deutsch",
    audioDirectory: "german",
    speakPrompt: "Sag den Satz…",
    letters: ["ä", "ö", "ü", "ß"],
    playable: true,
  },
  da: {
    code: "da",
    locale: "da-DK",
    name: "Danish",
    endonym: "Dansk",
    audioDirectory: "danish",
    speakPrompt: "Sig sætningen…",
    letters: ["æ", "ø", "å"],
    playable: false,
  },
};

export function isTargetLanguageCode(
  value: string | null | undefined,
): value is TargetLanguageCode {
  return supportedLanguageCodes.includes(value as TargetLanguageCode);
}

export function getTargetLanguage(code: TargetLanguageCode) {
  return targetLanguages[code];
}
