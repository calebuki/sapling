import type { TargetLanguageCode } from "@/lib/learning/languages";
import { normalizeWord } from "@/lib/learning/text";

// Word-level English glosses shown under hovered words. Glosses are
// deliberately short: a word's meaning in context comes from the phrase line.

export type Glossary = {
  lookup(word: string): string | undefined;
};

// Endings to try stripping when a form is not listed, longest first. German
// also tries adding them back ("trinkt" → "trink" + "en").
const suffixes: Record<TargetLanguageCode, string[]> = {
  sv: ["en", "et", "na", "arna", "erna", "orna", "ar", "er", "or", "n", "t"],
  de: ["sten", "ster", "stes", "est", "en", "em", "er", "es", "st", "e", "n", "s", "t"],
  da: ["erne", "ene", "en", "et", "er", "e", "r", "t"],
};
const infinitiveEndings: Partial<Record<TargetLanguageCode, string[]>> = { de: ["en", "n"] };

// Entries are "word=gloss" pairs separated by "|" or new lines.
export function createGlossary(code: TargetLanguageCode, ...sources: Array<string | Iterable<readonly [string, string]>>): Glossary {
  const map = new Map<string, string>();
  const add = (word: string, gloss: string) => {
    const key = normalizeWord(word, code);
    if (key && gloss && !map.has(key)) map.set(key, gloss);
  };
  for (const source of sources) {
    if (typeof source === "string") {
      for (const pair of source.split(/[|\n]/)) {
        const index = pair.indexOf("=");
        if (index > 0) add(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
      }
    } else {
      for (const [word, gloss] of source) add(word, gloss);
    }
  }

  const stem = (key: string) => {
    for (const suffix of suffixes[code]) {
      if (key.length <= suffix.length + 2 || !key.endsWith(suffix)) continue;
      const base = key.slice(0, -suffix.length);
      const direct = map.get(base);
      if (direct) return direct;
      for (const ending of infinitiveEndings[code] ?? []) {
        const verb = map.get(base + ending);
        if (verb) return verb;
      }
    }
    return undefined;
  };

  return {
    lookup(word) {
      const key = normalizeWord(word, code);
      if (!key) return undefined;
      const direct = map.get(key) ?? stem(key);
      if (direct) return direct;
      // German participles: "gemacht" → "mach" → "machen".
      if (code === "de" && key.startsWith("ge") && key.length > 5) return stem(key.slice(2)) ?? map.get(key.slice(2));
      return undefined;
    },
  };
}
