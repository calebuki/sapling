import type { ConceptSeed, Course, Lesson, Unit } from "@/lib/learning/course";
import { buildUnits, itemGlosses } from "../dsl";
import { swedishLessons, swedishListenSpeakItems } from "./legacy-course";
import { a1 } from "./units-a1";
import { a2 } from "./units-a2";

// The Swedish course, A1 to A2. The island's first four chapters (hej, fika,
// resan, planer) keep their hand-written lessons and recorded audio; every
// other unit is written in the compact unit format (../dsl).

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

const legacyLessons: Lesson[] = swedishLessons.map((lesson) => ({
  ...lesson,
  exercises: lesson.exercises.map((exercise) => ({ ...exercise, meaning: meanings[exercise.expected] })),
}));

// The first island chapters: one per villager, as the game first shipped.
const legacyUnits: Unit[] = [
  {
    id: "hej",
    level: "A1",
    villager: "elin",
    title: { t: "Hej!", en: "Hello!" },
    about: "Greetings, yes and no, and your first introduction.",
    slugs: ["hej", "tack", "ja", "nej", "jag-heter", "vad-heter-du", "trevligt-att-traeffas", "vet-inte", "det-aer"],
  },
  {
    id: "fika",
    level: "A1",
    villager: "bosse",
    title: { t: "Fika", en: "Coffee break" },
    about: "Drinks, buns and ordering at the café counter.",
    slugs: ["kaffe", "te", "vatten", "mjoelk", "kanelbulle", "jag-skulle-vilja", "med-mjoelk", "och-en-kanelbulle", "vill-ha", "gillar", "har", "cafe-order-drink", "cafe-order-food", "cafe-ask-bill"],
  },
  {
    id: "resan",
    level: "A1",
    villager: "stina",
    title: { t: "Resan", en: "The journey" },
    about: "Finding your way, taking the train and asking for help.",
    slugs: ["var-ligger-stationen", "taget-till-stockholm", "jag-ska-av-haer", "jag-foerstar-inte", "kan-du-upprepa", "prata-langsammare", "finns", "kan", "behoever"],
  },
  {
    id: "planer",
    level: "A2",
    villager: "astrid",
    title: { t: "Planer", en: "Plans" },
    about: "Maybe, shall we, word order, not, and talking about the past.",
    slugs: ["kanske", "ska-vi-infinitive", "v2-idag", "negation", "past-gick", "perfect-har"],
  },
];

const legacyConcepts: Array<[string, ConceptSeed["kind"], string, string]> = [
  ["hej", "word", "hej", "hello"],
  ["tack", "word", "tack", "thanks"],
  ["ja", "word", "ja", "yes"],
  ["nej", "word", "nej", "no"],
  ["jag-heter", "chunk", "jag heter …", "my name is …"],
  ["vad-heter-du", "chunk", "vad heter du?", "what is your name?"],
  ["trevligt-att-traeffas", "chunk", "trevligt att träffas", "nice to meet you"],
  ["vet-inte", "chunk", "Jag vet inte", "I do not know"],
  ["det-aer", "construction", "Det är", "It is"],
  ["kaffe", "word", "kaffe", "coffee"],
  ["te", "word", "te", "tea"],
  ["vatten", "word", "vatten", "water"],
  ["mjoelk", "word", "mjölk", "milk"],
  ["kanelbulle", "word", "kanelbulle", "cinnamon bun"],
  ["jag-skulle-vilja", "construction", "jag skulle vilja ha …", "I would like …"],
  ["med-mjoelk", "chunk", "med mjölk", "with milk"],
  ["och-en-kanelbulle", "chunk", "och en kanelbulle, tack", "and a cinnamon bun, please"],
  ["vill-ha", "chunk", "Jag vill ha", "I want"],
  ["gillar", "construction", "Jag gillar", "I like"],
  ["har", "construction", "Jag har", "I have"],
  ["cafe-order-drink", "communicative_function", "beställa en dryck", "order a drink"],
  ["cafe-order-food", "communicative_function", "beställa något att äta", "order something to eat"],
  ["cafe-ask-bill", "communicative_function", "be om notan", "ask for the bill"],
  ["var-ligger-stationen", "chunk", "var ligger stationen?", "where is the station?"],
  ["taget-till-stockholm", "chunk", "går det här tåget till Stockholm?", "does this train go to Stockholm?"],
  ["jag-ska-av-haer", "chunk", "jag ska av här", "I need to get off here"],
  ["jag-foerstar-inte", "chunk", "jag förstår inte", "I do not understand"],
  ["kan-du-upprepa", "chunk", "kan du upprepa det?", "can you repeat that?"],
  ["prata-langsammare", "chunk", "kan du prata lite långsammare?", "can you speak more slowly?"],
  ["finns", "construction", "Det finns", "There is"],
  ["kan", "construction", "Jag kan", "I can"],
  ["behoever", "construction", "Jag behöver", "I need"],
  ["kanske", "word", "kanske", "maybe"],
  ["ska-vi-infinitive", "construction", "ska vi + infinitiv", "shall we + verb"],
  ["v2-idag", "construction", "Idag jobbar jag", "Today I work"],
  ["negation", "construction", "Jag kommer inte", "I am not coming"],
  ["past-gick", "construction", "Igår gick jag", "Yesterday I went"],
  ["perfect-har", "construction", "Jag har varit", "I have been"],
];

export const articles = ["en", "ett"] as const;

const built = buildUnits("sv", [...a1, ...a2], {
  voices: ["sv-SE-SofieNeural", "sv-SE-MattiasNeural"],
  articles,
});

// Course order: the legacy chapters sit where their level puts them.
const order = [
  "hej", "hejsan", "vem", "fika", "siffror", "familj", "mat",
  "resan", "klockan", "handla", "hemma", "vaegen", "klaeder",
  "planer", "vaedret", "fritid", "haelsa", "jobb", "igaar", "naturen", "traeffas", "resa", "kaenslor", "framtid", "aasikter",
];

const units: Unit[] = order.map((id) => {
  const unit = legacyUnits.find((u) => u.id === id) ?? built.units.find((u) => u.id === id);
  if (!unit) throw new Error(`No Swedish unit ${id}`);
  return unit;
});
if (units.length !== legacyUnits.length + built.units.length) throw new Error("Every Swedish unit needs a place in the course order");

function seedsFor(unitList: Unit[]): ConceptSeed[] {
  return legacyConcepts.map(([slug, kind, canonicalForm, gloss]) => {
    const unit = unitList.find((u) => u.slugs.includes(slug))!;
    return { slug, kind, canonicalForm, gloss, description: gloss, level: unit.level, unit: unit.id };
  });
}

// Lessons follow the unit order, so new phrases arrive chapter by chapter.
function inUnitOrder(lessons: Lesson[], unitList: Unit[]) {
  const rank = (slug: string) => unitList.findIndex((u) => u.slugs.includes(slug));
  const first = (lesson: Lesson) => Math.min(...lesson.exercises.map((e) => rank(e.conceptSlug)).filter((r) => r >= 0), 999);
  return [...lessons].sort((a, b) => first(a) - first(b));
}

const rank = (slug: string) => units.findIndex((u) => u.slugs.includes(slug));

export const course: Course = {
  languageCode: "sv",
  units,
  lessons: inUnitOrder([...legacyLessons, ...built.lessons], units),
  listenSpeakItems: [...swedishListenSpeakItems, ...built.listenSpeakItems],
  concepts: [...seedsFor(legacyUnits), ...built.concepts].sort((a, b) => rank(a.slug) - rank(b.slug)),
};

// Hover glosses the course gives for free: every single-word item.
export const courseGlosses = itemGlosses(built, articles);
