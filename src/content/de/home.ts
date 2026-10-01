import type { HomeAnchor, HomeConfig, HomeThing, Spot } from "@/lib/game/home";

// Hilde's farmhouse parlour. Her family comes for dinner and she can't find
// her things. Where something is takes the dative, which the "Wo ist das?"
// tip teaches: auf dem Tisch, unter dem Bett, neben der Tür, im Schrank.

type Gender = "m" | "f" | "n";
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const furniture: Array<HomeAnchor & { gender: Gender; noun: string }> = [
  { slug: "der-tisch", model: "table", spots: ["on", "under", "next"], name: { t: "der Tisch", en: "the table" }, match: ["tisch"], gender: "m", noun: "Tisch" },
  { slug: "der-stuhl", model: "chair", spots: ["on", "under", "next"], name: { t: "der Stuhl", en: "the chair" }, match: ["stuhl"], gender: "m", noun: "Stuhl" },
  { slug: "das-bett", model: "bed", spots: ["on", "under", "next"], name: { t: "das Bett", en: "the bed" }, match: ["bett"], gender: "n", noun: "Bett" },
  { slug: "das-sofa", model: "sofa", spots: ["on", "next"], name: { t: "das Sofa", en: "the sofa" }, match: ["sofa"], gender: "n", noun: "Sofa" },
  { slug: "der-schrank", model: "cupboard", spots: ["in", "on", "next"], name: { t: "der Schrank", en: "the cupboard" }, match: ["schrank"], gender: "m", noun: "Schrank" },
  { slug: "der-herd", model: "stove", spots: ["on", "next"], name: { t: "der Herd", en: "the stove" }, match: ["herd"], gender: "m", noun: "Herd" },
  { slug: "der-kuehlschrank", model: "fridge", spots: ["in", "next"], name: { t: "der Kühlschrank", en: "the fridge" }, match: ["kühlschrank"], gender: "m", noun: "Kühlschrank" },
  { slug: "das-fenster", model: "window", spots: ["next"], name: { t: "das Fenster", en: "the window" }, match: ["fenster"], gender: "n", noun: "Fenster" },
  { slug: "die-tuer", model: "door", spots: ["next"], name: { t: "die Tür", en: "the door" }, match: ["tür"], gender: "f", noun: "Tür" },
  { slug: "die-lampe", model: "lamp", spots: ["next"], name: { t: "die Lampe", en: "the lamp" }, match: ["lampe"], gender: "f", noun: "Lampe" },
];

const belongings: Array<HomeThing & { gender: Gender; noun: string }> = [
  { slug: "die-katze", model: "cat", name: { t: "die Katze", en: "the cat" }, gender: "f", noun: "Katze" },
  { slug: "der-hund", model: "dog", name: { t: "der Hund", en: "the dog" }, gender: "m", noun: "Hund" },
  { slug: "der-schluessel", model: "key", name: { t: "der Schlüssel", en: "the key" }, gender: "m", noun: "Schlüssel" },
  { slug: "die-tasse", model: "cup", name: { t: "die Tasse", en: "the cup" }, gender: "f", noun: "Tasse" },
  { slug: "die-tasche", model: "bag", name: { t: "die Tasche", en: "the bag" }, gender: "f", noun: "Tasche" },
  { slug: "das-buch", model: "book", name: { t: "das Buch", en: "the book" }, gender: "n", noun: "Buch" },
  { slug: "die-uhr", model: "clock", name: { t: "die Uhr", en: "the clock" }, gender: "f", noun: "Uhr" },
  { slug: "die-blume", model: "flower", name: { t: "die Blume", en: "the flower" }, gender: "f", noun: "Blume" },
];

const anchorOf = (a: HomeAnchor) => furniture.find((f) => f.slug === a.slug)!;
const thingOf = (t: HomeThing) => belongings.find((b) => b.slug === t.slug)!;

const preposition: Record<Spot, { t: string; en: string }> = {
  on: { t: "auf", en: "on" },
  under: { t: "unter", en: "under" },
  next: { t: "neben", en: "next to" },
  in: { t: "in", en: "in" },
};

// Accusative: only der changes, to den.
const acc = (t: HomeThing) => {
  const { gender, noun } = thingOf(t);
  return `${gender === "m" ? "den" : gender === "f" ? "die" : "das"} ${noun}`;
};
const nom = (t: HomeThing) => thingOf(t).name.t;
const my = (t: HomeThing) => `${thingOf(t).gender === "f" ? "meine" : "mein"} ${thingOf(t).noun}`;
const pronoun = (t: HomeThing) => ({ m: "er", f: "sie", n: "es" })[thingOf(t).gender];

export const home: HomeConfig = {
  host: "hilde",
  anchors: furniture,
  things: belongings,
  prepositions: {
    on: { concept: "auf", words: ["auf"] },
    under: { concept: "unter", words: ["unter"] },
    next: { concept: "neben", words: ["neben"] },
    in: { concept: "in", words: ["in", "im"] },
  },
  where(spot, anchor) {
    const { gender, noun, name } = anchorOf(anchor);
    const article = gender === "f" ? "der" : "dem";
    // In dem is always shortened to im.
    const t = spot === "in" && article === "dem" ? `im ${noun}` : `${preposition[spot].t} ${article} ${noun}`;
    return { t, en: `${preposition[spot].en} ${name.en}` };
  },
  fetch(thing, where, variant) {
    return variant === 0
      ? { t: `Bring mir bitte ${acc(thing)} ${where.t}!`, en: `Please bring me ${thing.name.en} ${where.en}!` }
      : { t: `Ich brauche ${acc(thing)} ${where.t}.`, en: `I need ${thing.name.en} ${where.en}.` };
  },
  ask(thing) {
    return { t: `Wo ist ${my(thing)}?`, en: `Where is my ${thing.name.en.replace(/^the /, "")}?` };
  },
  notThere(thing, where) {
    return { t: `${capital(where.t)}? Da ist ${pronoun(thing)} nicht.`, en: `${capital(where.en)}? It isn't there.` };
  },
  found(where) {
    return { t: `Ah, ${where.t}! Danke, mein Kind!`, en: `Ah, ${where.en}! Thank you, my dear!` };
  },
  wrong(want, got) {
    const wantWhere = home.where(want.spot, want.anchor);
    if (want.thing.slug === got.thing.slug) {
      const gotWhere = home.where(got.spot, got.anchor);
      return {
        t: `Nein, das ist ${nom(got.thing)} ${gotWhere.t}. Ich brauche ${acc(want.thing)} ${wantWhere.t}.`,
        en: `No, that's ${got.thing.name.en} ${gotWhere.en}. I need ${want.thing.name.en} ${wantWhere.en}.`,
      };
    }
    return {
      t: `Das ist doch ${nom(got.thing)}! Ich brauche ${acc(want.thing)} ${wantWhere.t}.`,
      en: `But that's ${got.thing.name.en}! I need ${want.thing.name.en} ${wantWhere.en}.`,
    };
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Wörter über das Haus!", en: "First learn a few words about the house!" },
    intro: [
      { t: "Ach, gut, dass du da bist, mein Kind!", en: "Oh, good that you're here, my dear!" },
      { t: "Heute Abend kommt meine Familie zum Essen.", en: "My family is coming for dinner this evening." },
      { t: "Aber ich finde meine Sachen nicht! Hilf mir bitte.", en: "But I can't find my things! Please help me." },
    ],
    tellIntro: { t: "Und wenn ich frage: Wo ist …? Dann sag mir, wo es ist!", en: "And when I ask: Where is …? Then tell me where it is!" },
    title: { t: "Bei Hilde", en: "At Hilde's" },
    howTo: { t: "Klick auf die Sachen und bring sie zu Hilde.", en: "Click the things and bring them to Hilde." },
    tell: { t: "Sag Hilde, wo es ist!", en: "Tell Hilde where it is!" },
    clock: { t: "Die Familie kommt!", en: "The family is coming!" },
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    thanks: [
      { t: "Danke, mein Kind!", en: "Thank you, my dear!" },
      { t: "Wunderbar, danke!", en: "Wonderful, thanks!" },
      { t: "Super, vielen Dank!", en: "Great, thanks a lot!" },
    ],
    late: { t: "Oh nein, die Familie ist schon da!", en: "Oh no, the family's already here!" },
    done: [
      { t: "Alles gefunden! Du bist ein Schatz!", en: "Everything found! You're a treasure!" },
      { t: "Danke, mein Kind! Alles ist da.", en: "Thank you, my dear! Everything's here." },
      { t: "Puh, die Familie ist da. Danke trotzdem!", en: "Phew, the family's here. Thanks anyway!" },
    ],
    harder: { t: "Morgen suche ich noch mehr Sachen!", en: "Tomorrow I'll be looking for even more things!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
  },
};
