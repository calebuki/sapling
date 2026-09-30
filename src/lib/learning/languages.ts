export const supportedLanguageCodes = ["sv", "de", "vi", "da"] as const;

export type TargetLanguageCode = (typeof supportedLanguageCodes)[number];

export type TargetLanguage = {
  code: TargetLanguageCode;
  locale: "da-DK" | "sv-SE" | "de-DE" | "vi-VN";
  name: "Danish" | "Swedish" | "German" | "Vietnamese";
  endonym: "Dansk" | "Svenska" | "Deutsch" | "Tiếng Việt";
  audioDirectory: "danish" | "swedish" | "german" | "vietnamese";
  speakPrompt: string;
  // Letters an English keyboard lacks, offered as buttons under answer fields.
  letters: string[];
  // Whether the island is playable yet; the hub shows the rest as coming soon.
  playable: boolean;
  // Which variety AI replies should keep to, where the language has several.
  variety?: string;
  // The accent synthetic voices should use, where it matters.
  accent?: string;
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
  // Northern (Hanoi) Vietnamese: the standard, and the accent that keeps all
  // six tones apart the way the spelling does.
  vi: {
    code: "vi",
    locale: "vi-VN",
    name: "Vietnamese",
    endonym: "Tiếng Việt",
    audioDirectory: "vietnamese",
    speakPrompt: "Nói câu này…",
    letters: ["ă", "â", "đ", "ê", "ô", "ơ", "ư"],
    playable: true,
    accent: "Northern (Hanoi)",
    variety:
      "Speak Northern (Hanoi) Vietnamese: use Northern words (bố, mẹ, vâng, bát, cốc, nghìn, quả), never Southern ones (ba, má, dạ, chén, ly, ngàn, trái).",
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
