import type { TargetLanguageCode } from "@/lib/learning/languages";
import { normalizeWord } from "@/lib/learning/text";

// Word-level English glosses shown under hovered words. Glosses are
// deliberately short: a word's meaning in context comes from the phrase line.

export type Glossary = {
  lookup(word: string): string | undefined;
};

// Endings to try stripping when a form is not listed. German and Swedish
// also try adding the infinitive ending back ("trinkt" → "trink" + "en",
// "pratade" → "prat" + "a"). Swedish verb and adjective endings come last so
// they never shadow a noun form.
const suffixes: Record<TargetLanguageCode, string[]> = {
  sv: ["en", "et", "na", "arna", "erna", "orna", "ar", "er", "or", "n", "t", "ade", "de", "te", "r", "s", "a"],
  de: ["sten", "ster", "stes", "est", "en", "em", "er", "es", "st", "e", "n", "s", "t"],
  da: ["erne", "ene", "en", "et", "er", "e", "r", "t"],
  // Vietnamese words never change form.
  vi: [],
};
const infinitiveEndings: Partial<Record<TargetLanguageCode, string[]>> = { de: ["en", "n"], sv: ["a"] };

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

// Vietnamese words are often several syllables written apart ("cà phê",
// "cảm ơn"), so runs of up to three syllables the glossary knows are kept
// together as one word.
const compoundLength: Partial<Record<TargetLanguageCode, number>> = { vi: 3 };

const WORD = /(\p{L}[\p{L}\p{N}]*)/u;

// Text split into words (odd indices) and what lies between them (even).
export function wordParts(text: string, code: TargetLanguageCode, knows: (word: string) => boolean): string[] {
  const parts = text.split(WORD);
  const longest = compoundLength[code] ?? 1;
  if (longest === 1) return parts;
  const out = [parts[0]];
  for (let i = 1; i < parts.length; i += 2) {
    let end = i;
    for (let n = longest; n > 1 && end === i; n--) {
      const last = i + (n - 1) * 2;
      if (last >= parts.length) continue;
      const spaced = parts.slice(i + 1, last).every((part, k) => k % 2 === 1 || part === " ");
      if (spaced && knows(parts.slice(i, last + 1).join(""))) end = last;
    }
    out.push(parts.slice(i, end + 1).join(""), parts[end + 1] ?? "");
    i = end;
  }
  return out;
}
