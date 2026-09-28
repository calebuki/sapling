import type { LessonExercise } from "@/lib/learning/course";
import { getTargetLanguage, type TargetLanguageCode } from "@/lib/learning/languages";
import { foldsFor, normalizeText, withoutArticle } from "@/lib/learning/text";
import { mulberry32 } from "./world";

export function personalize(text: string, name: string | null) {
  return text.replace(/Caleb/g, name?.trim() || "Kim").replace(/\{name\}/g, name?.trim() || "Kim");
}

// English for what the learner should say; instructions ("Ask their name.")
// carry their own meaning.
export function meaningOf(exercise: LessonExercise, name: string | null) {
  return personalize(exercise.meaning ?? exercise.prompt, name);
}

export function expectedFor(exercise: LessonExercise, name: string | null) {
  return personalize(exercise.expected, name);
}

export function splitWords(text: string) {
  return text.replace(/[.,!?¿¡…]/g, "").split(/\s+/).filter(Boolean);
}

// Word tiles: the answer's words plus a couple of plausible distractors.
export function buildTiles(expected: string, pool: string[], seed: number, code: TargetLanguageCode) {
  const locale = getTargetLanguage(code).locale;
  const words = splitWords(expected);
  const answer = new Set(words.map((w) => w.toLocaleLowerCase(locale)));
  const random = mulberry32(seed);
  const extras = [...new Set(pool.flatMap(splitWords))]
    .filter((w) => !answer.has(w.toLocaleLowerCase(locale)))
    .sort(() => random() - 0.5)
    .slice(0, words.length > 3 ? 3 : 2);
  const tiles = [...words, ...extras].map((word, index) => ({ id: `${index}-${word}`, word }));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

export type Check = "exact" | "accent" | "typo" | "article" | "wrong";

// Recalling the phrase is what counts: missing special letters (hard on English
// keyboards), a one-letter slip or a forgotten article pass, but the player is
// shown the exact spelling.
export function checkAnswer(answer: string, expected: string, code: TargetLanguageCode): Check {
  const a = normalizeText(answer, code);
  const e = normalizeText(expected, code);
  if (!a) return "wrong";
  if (a === e) return "exact";
  const folds = foldsFor(code);
  if (folds.some((fold) => fold(a) === fold(e))) return "accent";
  if (e.length >= 6 && folds.some((fold) => levenshtein(fold(a), fold(e)) <= (e.length > 16 ? 2 : 1))) return "typo";
  const bare = withoutArticle(e, code);
  if (bare && folds.some((fold) => fold(a) === fold(bare))) return "article";
  return "wrong";
}
