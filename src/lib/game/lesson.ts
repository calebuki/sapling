import { normalizeSwedish } from "@/lib/learning/adaptive";
import type { LessonExercise } from "@/lib/learning/course";
import { mulberry32 } from "./world";

// English meanings for course phrases whose prompt is an instruction rather
// than a translation ("Ask their name." → "What's your name?").
const meanings: Record<string, string> = {
  "Hej, jag heter Caleb.": "Hi, my name is {name}.",
  "Vad heter du?": "What's your name?",
  "Trevligt att träffas.": "Nice to meet you.",
  "Jag skulle vilja ha en kaffe.": "I would like a coffee.",
  "En kaffe med mjölk.": "A coffee with milk.",
  "Och en kanelbulle, tack.": "And a cinnamon bun, please.",
  "Jag skulle vilja ha en kaffe med mjölk, tack.": "I would like a coffee with milk, please.",
  "Kan jag få notan, tack?": "Can I have the bill, please?",
  "Var ligger stationen?": "Where is the station?",
  "Går det här tåget till Stockholm?": "Does this train go to Stockholm?",
  "Jag ska av här.": "I need to get off here.",
  "Jag förstår inte.": "I don't understand.",
  "Kan du upprepa det?": "Can you repeat that?",
  "Kan du prata lite långsammare?": "Can you speak a little more slowly?",
  "Kanske.": "Maybe.",
  "Ska vi ta tåget?": "Shall we take the train?",
};

export function personalize(text: string, name: string | null) {
  return text.replace(/Caleb/g, name?.trim() || "Kim").replace(/\{name\}/g, name?.trim() || "Kim");
}

export function meaningOf(exercise: LessonExercise, name: string | null) {
  const known = meanings[exercise.expected];
  if (known) return personalize(known, name);
  return exercise.prompt;
}

export function expectedFor(exercise: LessonExercise, name: string | null) {
  return personalize(exercise.expected, name);
}

export function splitWords(text: string) {
  return text.replace(/[.,!?¿¡…]/g, "").split(/\s+/).filter(Boolean);
}

// Word tiles: the answer's words plus a couple of plausible distractors.
export function buildTiles(expected: string, pool: string[], seed: number) {
  const words = splitWords(expected);
  const answer = new Set(words.map((w) => w.toLocaleLowerCase("sv-SE")));
  const random = mulberry32(seed);
  const extras = [...new Set(pool.flatMap(splitWords))]
    .filter((w) => !answer.has(w.toLocaleLowerCase("sv-SE")))
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

export type Check = "exact" | "accent" | "typo" | "wrong";

const fold = (s: string) => s.replace(/[åä]/g, "a").replace(/ö/g, "o");

// Recalling the phrase is what counts: missing å/ä/ö (hard on English keyboards)
// and a one-letter slip pass, but the player is shown the exact spelling.
export function checkAnswer(answer: string, expected: string): Check {
  const a = normalizeSwedish(answer);
  const e = normalizeSwedish(expected);
  if (!a) return "wrong";
  if (a === e) return "exact";
  if (fold(a) === fold(e)) return "accent";
  if (e.length >= 6 && levenshtein(fold(a), fold(e)) <= (e.length > 16 ? 2 : 1)) return "typo";
  return "wrong";
}
