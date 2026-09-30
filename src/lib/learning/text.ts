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
  vi: [unmarked],
};

// Vietnamese letters carry two kinds of marks: vowel shapes (ă â ê ô ơ ư, and
// đ) and the five tone marks. A tone mark makes a different word (ma, má, mà,
// mả, mã, mạ), so an answer typed with no tones at all is forgiven like a
// missing å, but once a learner types tones they all have to be right.
const TONE = /[\u0300\u0301\u0303\u0309\u0323]/u;

function unmarked(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFC");
}

function toneOf(syllable: string) {
  return TONE.exec(syllable.normalize("NFD"))?.[0] ?? "";
}

// Whether a Vietnamese answer has tone marks that don't match the expected ones.
export function wrongTones(answer: string, expected: string, code: TargetLanguageCode) {
  if (code !== "vi") return false;
  const typed = answer.split(" ").map(toneOf);
  if (!typed.some(Boolean)) return false;
  const wanted = expected.split(" ").map(toneOf);
  return typed.length !== wanted.length || typed.some((tone, i) => tone !== wanted[i]);
}

// How to compare an answer typed without tone marks, for accepted-answer
// patterns (null when marks were typed, or the language has none).
export function untonedFold(answer: string, code: TargetLanguageCode) {
  return code === "vi" && !TONE.test(answer.normalize("NFD")) ? unmarked : null;
}

export function foldsFor(code: TargetLanguageCode) {
  return folds[code];
}

// Articles a learner may leave off a noun ("Kaffee" for "der Kaffee").
const articles: Record<TargetLanguageCode, string[]> = {
  sv: ["en", "ett"],
  de: ["der", "die", "das", "ein", "eine"],
  da: ["en", "et"],
  // Vietnamese classifiers play the same part: "mèo" for "con mèo" (a cat).
  vi: ["con", "cái", "quả", "chiếc"],
};

export function withoutArticle(text: string, code: TargetLanguageCode) {
  const [first, ...rest] = text.split(" ");
  return rest.length > 0 && articles[code].includes(first) ? rest.join(" ") : null;
}

export function capitalize(word: string, code: TargetLanguageCode) {
  return word.charAt(0).toLocaleUpperCase(getTargetLanguage(code).locale) + word.slice(1);
}
