import type { Cefr, ConceptSeed, Lesson, LessonExercise, ListenSpeakItem, SpeechVoice, Unit } from "@/lib/learning/course";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { ConceptKind } from "@/types/learning";

// A compact way to write a course unit: one item per line, fields split by "|".
//
//   slug | target form | English | example = English / example = English | option | option
//
// Options are bare flags (chunk, construction, function, open) or "key: value":
//   say: Ich hätte gern einen Kaffee. = I'd like a coffee.   (what the learner produces)
//   accept: ^ich (hätte gern|möchte) .*kaffee                  (other right answers, ";;"-separated)
//   note: …                                                    (a teaching note)
//   task: Order any drink.                                     (prompt for open tasks)
//
// Without "say", the learner produces the target form itself. A target with
// "…" in it is a frame, so its first example becomes what they say.

export type UnitSource = {
  id: string;
  level: Cefr;
  villager: string;
  title: { t: string; en: string };
  about: string;
  items: string;
};

export type UnitItem = {
  slug: string;
  target: string;
  english: string;
  examples: Array<{ t: string; en: string }>;
  kind: ConceptKind;
  say: { t: string; en: string } | null;
  accept: string[];
  note: string | null;
  task: string | null;
};

const kinds: Record<string, ConceptKind> = {
  chunk: "chunk",
  construction: "construction",
  function: "communicative_function",
  word: "word",
};

function pair(text: string, where: string) {
  const index = text.indexOf(" = ");
  if (index < 0) throw new Error(`Missing " = " in ${where}: ${text}`);
  return { t: text.slice(0, index).trim(), en: text.slice(index + 3).trim() };
}

function isSingleWord(target: string, articles: readonly string[]) {
  const words = target.replace(/[…?!.,]/g, "").trim().split(/\s+/).filter(Boolean);
  const bare = words.length > 1 && articles.includes(words[0].toLowerCase()) ? words.slice(1) : words;
  return bare.length === 1;
}

export function parseItems(source: string, articles: readonly string[]): UnitItem[] {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [slug, target, english, examples = "", ...options] = line.split("|").map((part) => part.trim());
      if (!slug || !target || !english) throw new Error(`Incomplete item: ${line}`);
      const item: UnitItem = {
        slug,
        target,
        english,
        examples: examples ? examples.split(" / ").map((e) => pair(e, slug)) : [],
        kind: isSingleWord(target, articles) ? "word" : "chunk",
        say: null,
        accept: [],
        note: null,
        task: null,
      };
      for (const option of options) {
        const colon = option.indexOf(":");
        const key = colon > 0 ? option.slice(0, colon).trim() : option;
        const value = colon > 0 ? option.slice(colon + 1).trim() : "";
        if (kinds[key] && !value) item.kind = kinds[key];
        else if (key === "open") item.task = item.task ?? english;
        else if (key === "say") item.say = pair(value, slug);
        else if (key === "accept") item.accept = value.split(";;").map((p) => p.trim()).filter(Boolean);
        else if (key === "note") item.note = value;
        else if (key === "task") item.task = value;
        else throw new Error(`Unknown option "${option}" on ${slug}`);
      }
      if (!item.say && target.includes("…")) {
        if (!item.examples[0]) throw new Error(`${slug} is a frame and needs an example or say:`);
        item.say = item.examples[0];
      }
      return item;
    });
}

// Makes a list of sentences end like sentences, so answers read naturally.
function asAnswer(target: string) {
  return target.replace(/\s*…\s*/g, " ").trim();
}

export type BuiltUnits = {
  units: Unit[];
  lessons: Lesson[];
  listenSpeakItems: ListenSpeakItem[];
  concepts: ConceptSeed[];
  items: Map<string, UnitItem & { unit: string }>;
};

export function buildUnits(
  code: TargetLanguageCode,
  sources: UnitSource[],
  { voices, articles, lessonSize = 6 }: { voices: [SpeechVoice, SpeechVoice]; articles: readonly string[]; lessonSize?: number },
): BuiltUnits {
  const units: Unit[] = [];
  const lessons: Lesson[] = [];
  const listenSpeakItems: ListenSpeakItem[] = [];
  const concepts: ConceptSeed[] = [];
  const items = new Map<string, UnitItem & { unit: string }>();
  let voiceTurn = 0;

  for (const source of sources) {
    const parsed = parseItems(source.items, articles);
    units.push({ id: source.id, level: source.level, villager: source.villager, title: source.title, about: source.about, slugs: parsed.map((i) => i.slug) });
    const meanings = parsed.flatMap((i) => i.examples.map((e) => e.en));

    parsed.forEach((item, index) => {
      if (items.has(item.slug)) throw new Error(`Duplicate slug ${item.slug} in ${code}`);
      items.set(item.slug, { ...item, unit: source.id });
      const voice = voices[voiceTurn++ % 2];
      const expected = item.say ? item.say.t : asAnswer(item.target);
      const exercise: LessonExercise = {
        conceptSlug: item.slug,
        audioId: `${code}-${source.id}-${item.slug}`,
        voice,
        mode: item.task ? "open" : item.kind === "word" ? "repeat" : "guided",
        eyebrow: source.title.en,
        prompt: item.task ?? (item.say ? item.say.en : item.english),
        expected,
        meaning: item.say ? item.say.en : item.english,
        accept: item.accept.length ? item.accept : undefined,
        note: item.note ?? `${item.target} — ${item.english}`,
      };
      const lessonIndex = Math.floor(index / lessonSize);
      const lessonId = `${code}-${source.id}-${lessonIndex + 1}`;
      let lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        lesson = {
          id: lessonId,
          number: lessons.length + 1,
          title: `${source.title.en} ${lessonIndex + 1}`,
          description: source.about,
          exercises: [],
        };
        lessons.push(lesson);
      }
      lesson.exercises.push(exercise);

      item.examples.slice(0, 2).forEach((example, n) => {
        // Wrong options come from the same unit, so they are plausible but clearly different.
        const others = meanings.filter((m) => m !== example.en);
        const pickFrom = (offset: number) => others[(index * 3 + n * 5 + offset) % Math.max(1, others.length)];
        const distractors = [...new Set([pickFrom(1), pickFrom(4), pickFrom(7), pickFrom(10)])].filter(Boolean).slice(0, 2);
        listenSpeakItems.push({
          id: `${code}-${item.slug}-${n}`,
          conceptSlug: item.slug,
          audioId: `${code}-listen-${item.slug}-${n}`,
          voice: voices[(voiceTurn + n) % 2],
          text: example.t,
          meaning: example.en,
          options: [example.en, ...distractors],
        });
      });

      concepts.push({
        slug: item.slug,
        kind: item.kind,
        canonicalForm: asAnswer(item.target).replace(/[.!]$/, ""),
        gloss: item.english,
        description: item.note ?? item.english,
        level: source.level,
        unit: source.id,
      });
    });
  }
  return { units, lessons, listenSpeakItems, concepts, items };
}
