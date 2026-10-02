import type { Caller, ForestAnimal, ForestConfig, ForestPlace, Tile, Weather, WeatherWord } from "@/lib/game/forest";
import { spoken } from "@/lib/game/line";

// Sepp's mountain rescue. Where someone is takes the dative (im Wald, am See,
// auf dem Berg), what they can see the accusative (Ich sehe einen Fuchs), and
// the weather goes after "hier" with the verb second (Hier regnet es).

type Gender = "m" | "f" | "n";

const animals: Array<ForestAnimal & { gender: Gender; noun: string }> = [
  { slug: "das-reh", model: "deer", name: { t: "das Reh", en: "deer" }, terrains: ["forest", "meadow", "river"], gender: "n", noun: "Reh" },
  { slug: "der-fuchs", model: "fox", name: { t: "der Fuchs", en: "fox" }, terrains: ["forest", "meadow", "river"], gender: "m", noun: "Fuchs" },
  { slug: "der-igel", model: "hedgehog", name: { t: "der Igel", en: "hedgehog" }, terrains: ["meadow", "forest"], gender: "m", noun: "Igel" },
  { slug: "das-eichhoernchen", model: "squirrel", name: { t: "das Eichhörnchen", en: "squirrel" }, terrains: ["forest"], gender: "n", noun: "Eichhörnchen" },
  { slug: "das-pferd", model: "horse", name: { t: "das Pferd", en: "horse" }, terrains: ["meadow"], gender: "n", noun: "Pferd" },
  { slug: "der-vogel", model: "bird", name: { t: "der Vogel", en: "bird" }, terrains: ["lake", "forest", "mountain"], gender: "m", noun: "Vogel" },
  { slug: "die-ente", model: "duck", name: { t: "die Ente", en: "duck" }, terrains: ["lake", "river"], gender: "f", noun: "Ente" },
  { slug: "die-kuh", model: "cow", name: { t: "die Kuh", en: "cow" }, terrains: ["meadow", "mountain"], gender: "f", noun: "Kuh" },
  { slug: "das-schaf", model: "sheep", name: { t: "das Schaf", en: "sheep" }, terrains: ["meadow", "mountain"], gender: "n", noun: "Schaf" },
];

const places: ForestPlace[] = [
  { id: "lake", concept: "der-see", name: { t: "der See", en: "the lake" }, at: { t: "am See", en: "by the lake" }, to: { t: "zum See", en: "to the lake" } },
  { id: "meadow", concept: "die-wiese", name: { t: "die Wiese", en: "the meadow" }, at: { t: "auf der Wiese", en: "in the meadow" }, to: { t: "zur Wiese", en: "to the meadow" } },
  { id: "forest", concept: "der-wald", name: { t: "der Wald", en: "the forest" }, at: { t: "im Wald", en: "in the forest" }, to: { t: "in den Wald", en: "into the forest" } },
  { id: "mountain", concept: "der-berg", name: { t: "der Berg", en: "the mountain" }, at: { t: "auf dem Berg", en: "on the mountain" }, to: { t: "auf den Berg", en: "up the mountain" } },
  { id: "river", concept: "der-fluss", name: { t: "der Fluss", en: "the river" }, at: { t: "am Fluss", en: "by the river" }, to: { t: "zum Fluss", en: "to the river" } },
];

// The weather after "hier", "da" or "bei ihr": the verb comes second.
const after: Record<Weather, { t: string; en: string }> = {
  sun: { t: "ist es sonnig", en: "it's sunny" },
  clouds: { t: "ist es bewölkt", en: "it's cloudy" },
  rain: { t: "regnet es", en: "it's raining" },
  snow: { t: "schneit es", en: "it's snowing" },
  fog: { t: "ist es neblig", en: "it's foggy" },
  wind: { t: "ist es windig", en: "it's windy" },
  storm: { t: "gibt es ein Gewitter", en: "there's a thunderstorm" },
};

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

const callers: Caller[] = [
  { name: "Emma", gender: "woman" },
  { name: "Finn", gender: "man" },
  { name: "Lea", gender: "woman" },
  { name: "Jan", gender: "man" },
  { name: "Sophie", gender: "woman" },
  { name: "Felix", gender: "man" },
  { name: "Klara", gender: "woman" },
  { name: "Ben", gender: "man" },
];

const animalOf = (a: ForestAnimal) => animals.find((x) => x.slug === a.slug)!;
const placeOf = (t: Tile) => places.find((p) => p.id === t.terrain)!;
// "ein Reh" (who's there), "einen Fuchs" (what you see).
const nom = (a: ForestAnimal) => `${animalOf(a).gender === "f" ? "eine" : "ein"} ${animalOf(a).noun}`;
const acc = (a: ForestAnimal) => `${{ m: "einen", f: "eine", n: "ein" }[animalOf(a).gender]} ${animalOf(a).noun}`;
const anEn = (a: ForestAnimal) => `a ${a.name.en}`;
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);

export const forest: ForestConfig = {
  host: "sepp",
  animals,
  places,
  weathers,
  callers,
  call(caller, tile, place, clues) {
    const parts = [{ t: `Hilfe, hier ist ${caller.name}!`, en: `Help, this is ${caller.name}!` }];
    if (clues.includes("place")) parts.push({ t: `Ich bin ${place.at.t}.`, en: `I'm ${place.at.en}.` });
    if (clues.includes("weather")) parts.push({ t: `Hier ${after[tile.weather].t}.`, en: `${capital(after[tile.weather].en)} here.` });
    if (clues.includes("animal") && tile.animal) parts.push({ t: `Ich sehe ${acc(tile.animal)}.`, en: `I can see ${anEn(tile.animal)}.` });
    return spoken(
      parts.map((p) => p.t),
      parts.map((p) => p.en).join(" "),
    );
  },
  wrong(caller, want, got, clue) {
    const she = caller.gender === "woman" ? { t: "Sie", en: "She", dat: "ihr", dEn: "her" } : { t: "Er", en: "He", dat: "ihm", dEn: "him" };
    if (clue === "place") {
      return spoken([`Nein, das ist ${placeOf(got).name.t}.`, `${she.t} ist ${placeOf(want).at.t}!`], `No, that's ${placeOf(got).name.en}. ${she.en}'s ${placeOf(want).at.en}!`);
    }
    if (clue === "weather") {
      return spoken([`Nein, da ${after[got.weather].t}.`, `Bei ${she.dat} ${after[want.weather].t}!`], `No, ${after[got.weather].en} there. Where ${she.en.toLowerCase()} is, ${after[want.weather].en}!`);
    }
    const seen = want.animal!;
    const there = got.animal;
    return spoken(
      [there ? `Nein, da ist ${nom(there)}.` : "Nein, da ist kein Tier.", `${she.t} sieht ${acc(seen)}!`],
      `No, there's ${there ? anEn(there) : "no animal"} there. ${she.en} can see ${anEn(seen)}!`,
    );
  },
  askWeather(place) {
    return spoken([`Ich fahre ${place.to.t}.`, `Wie ist das Wetter ${place.at.t}?`], `I'm driving ${place.to.en}. What's the weather like ${place.at.en}?`);
  },
  gear(weather) {
    switch (weather) {
      case "sun":
        return { t: "Super, dann brauche ich keine Jacke!", en: "Great, then I don't need a jacket!" };
      case "clouds":
      case "wind":
        return { t: "Danke! Dann nehme ich eine Jacke mit.", en: "Thanks! Then I'll take a jacket." };
      case "rain":
        return { t: "Danke! Dann nehme ich den Regenschirm mit.", en: "Thanks! Then I'll take the umbrella." };
      case "snow":
        return { t: "Brr! Dann nehme ich die Mütze und den Schal mit.", en: "Brr! Then I'll take my hat and scarf." };
      case "fog":
      case "storm":
        return { t: "Oje! Dann fahre ich ganz langsam.", en: "Oh dear! Then I'll drive very slowly." };
    }
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Orte in der Natur!", en: "First learn a few places out in nature!" },
    intro: [
      { t: "Servus! Gut, dass du da bist.", en: "Hi! Good that you're here." },
      { t: "Heute sind viele Wanderer unterwegs, und manche haben sich verlaufen.", en: "Lots of hikers are out today, and some have got lost." },
      { t: "Sie rufen mit dem Funkgerät an. Hör gut zu und zeig mir auf der Karte, wo sie sind!", en: "They call on the radio. Listen carefully and show me on the map where they are!" },
    ],
    weatherIntro: { t: "Und manchmal frage ich: Wie ist das Wetter dort? Dann schau auf die Karte und sag es mir!", en: "And sometimes I ask: what's the weather like there? Then look at the map and tell me!" },
    title: { t: "Die Bergwacht", en: "Mountain rescue" },
    clock: { t: "Es wird dunkel", en: "It's getting dark" },
    radio: { t: "Funkgerät", en: "Radio" },
    howTo: { t: "Hör zu und klick auf der Karte, wo die Person ist.", en: "Listen, and click the place on the map where the person is." },
    found: [
      { t: "Gefunden! Ich fahre sofort los.", en: "Found them! I'm setting off right away." },
      { t: "Super, da ist jemand! Ich komme!", en: "Great, there's someone there! I'm coming!" },
      { t: "Gut gemacht! Ich fahre hin.", en: "Well done! I'm driving there." },
    ],
    weatherWrong: { t: "Hmm, schau noch mal auf die Karte!", en: "Hmm, look at the map again!" },
    tellWeather: { t: "Sag Sepp, wie das Wetter dort ist!", en: "Tell Sepp what the weather is like there!" },
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    late: { t: "Oh, es ist schon dunkel! Morgen suchen wir weiter.", en: "Oh, it's dark already! We'll keep looking tomorrow." },
    done: [
      { t: "Alle Wanderer sind wieder da! Danke, du bist super!", en: "All the hikers are back! Thanks, you're great!" },
      { t: "Gut gemacht! Fast alle sind wieder da.", en: "Well done! Almost everyone is back." },
      { t: "Hmm, viele sind noch draußen. Morgen wieder!", en: "Hmm, lots are still out there. Again tomorrow!" },
    ],
    harder: { t: "Morgen sind noch mehr Wanderer unterwegs!", en: "Tomorrow there'll be even more hikers out!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
  },
};
