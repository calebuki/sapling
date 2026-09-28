import { getTargetLanguage, type TargetLanguageCode } from "./languages";

// Language-aware text rules shared by answer checking, glossing and scenes.
// Vowel letters are meaningful (Swedish a/å/ä, German a/ä), so normalizing
// never strips them; only the separate `folds` forgive keyboard substitutes.

export function normalizeText(text: string, code: TargetLanguageCode) {
  return text
    .normalize("NFC")
    .toLocaleLowerCase(getTargetLanguage(code).locale)
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// One word, lowercased and stripped of punctuation, for dictionary lookups.
export function normalizeWord(word: string, code: TargetLanguageCode) {
  return word.normalize("NFC").toLocaleLowerCase(getTargetLanguage(code).locale).replace(/[^\p{L}\p{N}]/gu, "");
}

// Ways a learner on an English keyboard might type the special letters. Each
// fold maps both answer and expected text, so any one match is a pass.
const folds: Record<TargetLanguageCode, Array<(s: string) => string>> = {
  sv: [(s) => s.replace(/[åä]/g, "a").replace(/ö/g, "o")],
  de: [
    (s) => s.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss"),
    (s) => s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss"),
  ],
  da: [(s) => s.replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "aa")],
};

export function foldsFor(code: TargetLanguageCode) {
  return folds[code];
}

// Articles a learner may leave off a noun ("Kaffee" for "der Kaffee").
const articles: Record<TargetLanguageCode, string[]> = {
  sv: ["en", "ett"],
  de: ["der", "die", "das", "ein", "eine"],
  da: ["en", "et"],
};

export function withoutArticle(text: string, code: TargetLanguageCode) {
  const [first, ...rest] = text.split(" ");
  return rest.length > 0 && articles[code].includes(first) ? rest.join(" ") : null;
}

export function capitalize(word: string, code: TargetLanguageCode) {
  return word.charAt(0).toLocaleUpperCase(getTargetLanguage(code).locale) + word.slice(1);
}
