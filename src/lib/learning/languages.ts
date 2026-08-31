export const supportedLanguageCodes = ["da", "sv"] as const;

export type TargetLanguageCode = (typeof supportedLanguageCodes)[number];

export type TargetLanguage = {
  code: TargetLanguageCode;
  locale: "da-DK" | "sv-SE";
  name: "Danish" | "Swedish";
  endonym: "Dansk" | "Svenska";
  audioDirectory: "danish" | "swedish";
  speakPrompt: string;
};

export const targetLanguages: Record<TargetLanguageCode, TargetLanguage> = {
  da: {
    code: "da",
    locale: "da-DK",
    name: "Danish",
    endonym: "Dansk",
    audioDirectory: "danish",
    speakPrompt: "Sig sætningen…",
  },
  sv: {
    code: "sv",
    locale: "sv-SE",
    name: "Swedish",
    endonym: "Svenska",
    audioDirectory: "swedish",
    speakPrompt: "Säg meningen…",
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
