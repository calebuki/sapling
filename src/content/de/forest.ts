import type { ForestAnimal, ForestConfig, ForestPlace, Hobby, WeatherWord } from "@/lib/game/forest";
import { spoken } from "@/lib/game/line";
import { normalizeText } from "@/lib/learning/text";

// Sepp's wildlife survey from the lookout over the clearing. Where an animal
// is takes the dative again (im Wald, auf der Wiese, am See, auf dem Baum),
// and the weather goes in the logbook in the words the course teaches.

type Gender = "m" | "f" | "n";

const animals: Array<ForestAnimal & { gender: Gender; one: string; many: string }> = [
  { slug: "das-reh", model: "deer", name: { t: "das Reh", en: "deer" }, habitats: ["meadow", "forest"], herd: false, gender: "n", one: "Reh", many: "Rehe" },
  { slug: "der-fuchs", model: "fox", name: { t: "der Fuchs", en: "fox" }, habitats: ["forest", "meadow"], herd: false, gender: "m", one: "Fuchs", many: "Füchse" },
  { slug: "der-igel", model: "hedgehog", name: { t: "der Igel", en: "hedgehog" }, habitats: ["meadow", "forest"], herd: false, gender: "m", one: "Igel", many: "Igel" },
  { slug: "das-eichhoernchen", model: "squirrel", name: { t: "das Eichhörnchen", en: "squirrel" }, habitats: ["tree", "forest"], herd: false, gender: "n", one: "Eichhörnchen", many: "Eichhörnchen" },
  { slug: "das-pferd", model: "horse", name: { t: "das Pferd", en: "horse" }, habitats: ["meadow"], herd: false, gender: "n", one: "Pferd", many: "Pferde" },
  { slug: "der-vogel", model: "bird", name: { t: "der Vogel", en: "bird" }, habitats: ["tree"], herd: true, gender: "m", one: "Vogel", many: "Vögel" },
  { slug: "die-ente", model: "duck", name: { t: "die Ente", en: "duck" }, habitats: ["lake"], herd: true, gender: "f", one: "Ente", many: "Enten" },
  { slug: "die-kuh", model: "cow", name: { t: "die Kuh", en: "cow" }, habitats: ["meadow"], herd: true, gender: "f", one: "Kuh", many: "Kühe" },
  { slug: "das-schaf", model: "sheep", name: { t: "das Schaf", en: "sheep" }, habitats: ["meadow"], herd: true, gender: "n", one: "Schaf", many: "Schafe" },
];

const places: ForestPlace[] = [
  { id: "lake", concept: "der-see", at: { t: "am See", en: "by the lake" } },
  { id: "meadow", concept: "die-wiese", at: { t: "auf der Wiese", en: "in the meadow" } },
  { id: "forest", concept: "der-wald", at: { t: "im Wald", en: "in the forest" } },
  { id: "tree", concept: "der-baum", at: { t: "auf dem Baum", en: "in the tree" } },
];

const weathers: WeatherWord[] = [
  { id: "sun", concepts: ["sonnig", "die-sonne"], accept: [String.raw`\bsonnig\b`, String.raw`\bsonne\b`], say: { t: "Es ist sonnig.", en: "It's sunny." } },
  { id: "clouds", concepts: ["bewoelkt", "die-wolke"], accept: [String.raw`\bbewölkt\b`, String.raw`\bwolken\b`, String.raw`\bwolkig\b`], say: { t: "Es ist bewölkt.", en: "It's cloudy." } },
  { id: "rain", concepts: ["es-regnet", "der-regen"], accept: [String.raw`\bregnet\b`, String.raw`\bregen\b`], say: { t: "Es regnet.", en: "It's raining." } },
  { id: "snow", concepts: ["es-schneit", "der-schnee"], accept: [String.raw`\bschneit\b`, String.raw`\bschnee\b`], say: { t: "Es schneit.", en: "It's snowing." } },
  { id: "fog", concepts: ["neblig", "der-nebel"], accept: [String.raw`\bneblig\b`, String.raw`\bnebel\b`], say: { t: "Es ist neblig.", en: "It's foggy." } },
  { id: "wind", concepts: ["windig", "der-wind"], accept: [String.raw`\bwindig\b`, String.raw`\bwind\b`], say: { t: "Es ist windig.", en: "It's windy." } },
  // In a thunderstorm, "es regnet" is true too.
  { id: "storm", concepts: ["das-gewitter"], accept: [String.raw`\bgewitter\b`], say: { t: "Es gibt ein Gewitter.", en: "There's a thunderstorm." }, alsoOk: ["rain"] },
];

const hobbies: Hobby[] = [
  { concept: "wandern", accept: [String.raw`\bwander(e|n)\b`] },
  { concept: "schwimmen", accept: [String.raw`\bschwimme?n?\b`] },
  { concept: "rad-fahren", accept: [String.raw`\b(fahre|fahren)( ich)? (gern |am liebsten )?rad\b`, String.raw`\brad fahren\b`] },
  { concept: "singen", accept: [String.raw`\bsinge\b`] },
  { concept: "tanzen", accept: [String.raw`\btanze\b`] },
  { concept: "malen", accept: [String.raw`\bmale\b`] },
  { concept: "fotografieren", accept: [String.raw`\bfotografiere\b`] },
  { concept: "fussball", accept: [String.raw`\bfußball\b`] },
  { concept: "tennis", accept: [String.raw`\btennis\b`] },
  { concept: "die-musik", accept: [String.raw`\bmusik\b`] },
  { concept: "lesen", accept: [String.raw`\blese\b`] },
  { concept: "spazieren-gehen", accept: [String.raw`\bspazieren\b`] },
];

const animalOf = (a: ForestAnimal) => animals.find((x) => x.slug === a.slug)!;
const the = (a: ForestAnimal) => {
  const x = animalOf(a);
  return x.herd ? `die ${x.many}` : `${{ m: "der", f: "die", n: "das" }[x.gender]} ${x.one}`;
};
const a = (x: ForestAnimal) => {
  const y = animalOf(x);
  return `${y.gender === "f" ? "eine" : "ein"} ${y.one}`;
};
const accTheEn = (x: ForestAnimal) => (animalOf(x).herd ? `the ${animalOf(x).name.en}${x.model === "sheep" ? "" : "s"}` : `the ${x.name.en}`);

const words = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
const english = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const fold = (w: string) => w.replace(/ä|ae/g, "a").replace(/ö|oe/g, "o").replace(/ü|ue/g, "u").replace(/ß/g, "ss");
const values: Record<string, number> = Object.fromEntries([...words.map((w, i) => [fold(w), i] as const), ["ein", 1] as const, ["eine", 1] as const]);

// "Es sind drei Enten." is said both when you're right and when you're not.
const thereAre = (x: ForestAnimal, n: number) => ({ t: `Es sind ${words[n]} ${animalOf(x).many}.`, en: `There are ${english[n]} ${x.model === "sheep" ? "sheep" : `${x.name.en}s`}.` });

export const forest: ForestConfig = {
  host: "sepp",
  animals,
  places,
  weathers,
  numbers: { 1: "eins", 2: "zwei", 3: "drei", 4: "vier", 5: "fuenf", 6: "sechs", 7: "sieben", 8: "acht", 9: "neun", 10: "zehn", 11: "elf", 12: "zwoelf" },
  hobbies,
  likeFrame: { concept: "ich-spiele-gern", pattern: String.raw`\bich \p{L}+( \p{L}+)? (gern|am liebsten)\b|\bam liebsten\b` },
  photo(animal, place, variant) {
    const what = place ? `${the(animal)} ${place.at.t}` : the(animal);
    const en = place ? `${accTheEn(animal)} ${place.at.en}` : accTheEn(animal);
    // Variant 1 points it out first, as two clips: "Schau, das Reh im Wald! Mach schnell ein Foto!"
    return variant === 0 ? { t: `Fotografier ${what}!`, en: `Take a photo of ${en}!` } : spoken([`Schau, ${what}!`, "Mach schnell ein Foto!"], `Look, ${en}! Quick, take a photo!`);
  },
  count(animal, place) {
    const x = animalOf(animal);
    return { t: `Wie viele ${x.many} sind ${place.at.t}?`, en: `How many ${x.model === "sheep" ? "sheep" : `${x.name.en}s`} are there ${place.at.en}?` };
  },
  counted(animal, n) {
    const there = thereAre(animal, n);
    return spoken(["Genau!", there.t], `Exactly! ${there.en}`);
  },
  miscounted(animal, n) {
    const there = thereAre(animal, n);
    return spoken(["Hmm, nein.", there.t], `Hmm, no. ${there.en}`);
  },
  wrongAnimal(got) {
    return { t: `Nein, das ist ${a(got)}!`, en: `No, that's a ${got.name.en}!` };
  },
  wrongPlace(want) {
    return { t: `Nein, das andere, ${want.at.t}!`, en: `No, the other one, ${want.at.en}!` };
  },
  parseNumber(text, code) {
    const said = normalizeText(text, code).split(" ").filter(Boolean);
    if (said.some((w) => /\d/.test(w))) return "digits";
    const n = said.map((w) => values[fold(w)]).find((v) => v !== undefined);
    return n ?? null;
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Tiere!", en: "First learn a few animals!" },
    intro: [
      { t: "Servus! Heute zählen wir die Tiere im Wald.", en: "Hi! Today we're counting the animals in the forest." },
      { t: "Ich sage dir, welches Tier du fotografieren sollst.", en: "I'll tell you which animal to photograph." },
      { t: "Aber leise! Die Tiere sind scheu.", en: "But quietly! The animals are shy." },
    ],
    title: { t: "Die Tierzählung", en: "The animal count" },
    clock: { t: "Es wird dunkel", en: "It's getting dark" },
    nice: [
      { t: "Super Foto!", en: "Great photo!" },
      { t: "Schön! Das kommt ins Logbuch.", en: "Lovely! That goes in the logbook." },
      { t: "Toll, das ist ein gutes Foto!", en: "Great, that's a good photo!" },
    ],
    weatherAsk: { t: "Oh, das Wetter ist anders! Wie ist das Wetter jetzt?", en: "Oh, the weather's changed! What's the weather like now?" },
    weatherWrong: { t: "Hmm, schau noch mal zum Himmel!", en: "Hmm, look at the sky again!" },
    weatherRight: { t: "Genau, das schreibe ich auf.", en: "Exactly, I'll write that down." },
    countHow: { t: "Zähl genau und schreib die Zahl!", en: "Count carefully and write the number!" },
    words: { t: "Mit Wörtern, bitte!", en: "In words, please!" },
    hikerHello: { t: "Hallo! Ich wandere heute zum Berg.", en: "Hi! I'm hiking up the mountain today." },
    hikerAsk: { t: "Und du? Was machst du gern?", en: "And you? What do you like doing?" },
    hikerReply: { t: "Toll! Ich wandere am liebsten.", en: "Great! I like hiking most of all." },
    hikerHuh: { t: "Wie bitte? Was machst du gern?", en: "Pardon? What do you like doing?" },
    hobbyHint: { t: "Ich fotografiere gern.", en: "I like taking photos." },
    logbook: { t: "Das Logbuch", en: "The logbook" },
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    late: { t: "Oh, es ist schon dunkel. Die Tiere schlafen jetzt.", en: "Oh, it's dark already. The animals are asleep now." },
    done: [
      { t: "Alle Tiere im Logbuch! Du bist ein echter Förster!", en: "Every animal in the logbook! You're a real forester!" },
      { t: "Gut gemacht! Fast alle Tiere sind im Logbuch.", en: "Well done! Almost every animal is in the logbook." },
      { t: "Hmm, das Logbuch ist noch leer. Morgen wieder!", en: "Hmm, the logbook is still empty. Again tomorrow!" },
    ],
    harder: { t: "Morgen gehen wir tiefer in den Wald!", en: "Tomorrow we'll go deeper into the forest!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
  },
};
