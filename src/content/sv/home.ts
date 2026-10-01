import type { HomeAnchor, HomeConfig, HomeThing, Spot } from "@/lib/game/home";

// Maja's house on Lilla Ö. Her family comes for dinner and she can't find her
// things. Swedish puts the article on the end, so a place is just the word
// and the noun: på bordet, under sängen, bredvid dörren.

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const furniture: Array<HomeAnchor & { the: string }> = [
  { slug: "ett-bord", model: "table", spots: ["on", "under", "next"], name: { t: "bordet", en: "the table" }, match: ["bord", "bordet"], the: "bordet" },
  { slug: "en-stol", model: "chair", spots: ["on", "under", "next"], name: { t: "stolen", en: "the chair" }, match: ["stol", "stolen"], the: "stolen" },
  { slug: "en-saeng", model: "bed", spots: ["on", "under", "next"], name: { t: "sängen", en: "the bed" }, match: ["säng", "sängen"], the: "sängen" },
  { slug: "en-soffa", model: "sofa", spots: ["on", "next"], name: { t: "soffan", en: "the sofa" }, match: ["soffa", "soffan"], the: "soffan" },
  { slug: "ett-foenster", model: "window", spots: ["next"], name: { t: "fönstret", en: "the window" }, match: ["fönster", "fönstret"], the: "fönstret" },
  { slug: "en-doerr", model: "door", spots: ["next"], name: { t: "dörren", en: "the door" }, match: ["dörr", "dörren"], the: "dörren" },
  { slug: "en-lampa", model: "lamp", spots: ["next"], name: { t: "lampan", en: "the lamp" }, match: ["lampa", "lampan"], the: "lampan" },
];

const belongings: Array<HomeThing & { a: string; the: string }> = [
  { slug: "en-katt", model: "cat", name: { t: "katten", en: "the cat" }, a: "katt", the: "katten" },
  { slug: "en-hund", model: "dog", name: { t: "hunden", en: "the dog" }, a: "hund", the: "hunden" },
  { slug: "en-nyckel", model: "key", name: { t: "nyckeln", en: "the key" }, a: "nyckel", the: "nyckeln" },
  { slug: "en-kopp", model: "cup", name: { t: "koppen", en: "the cup" }, a: "kopp", the: "koppen" },
  { slug: "en-bok", model: "book", name: { t: "boken", en: "the book" }, a: "bok", the: "boken" },
  { slug: "en-blomma", model: "flower", name: { t: "blomman", en: "the flower" }, a: "blomma", the: "blomman" },
];

const thingOf = (t: HomeThing) => belongings.find((b) => b.slug === t.slug)!;

const preposition: Record<Spot, { t: string; en: string }> = {
  on: { t: "på", en: "on" },
  under: { t: "under", en: "under" },
  next: { t: "bredvid", en: "next to" },
  in: { t: "i", en: "in" },
};

export const home: HomeConfig = {
  host: "maja",
  anchors: furniture,
  things: belongings,
  prepositions: {
    on: { concept: "paa", words: ["på"] },
    under: { concept: "under", words: ["under"] },
    next: { concept: "bredvid", words: ["bredvid"] },
    in: { concept: "i", words: ["i"] },
  },
  where(spot, anchor) {
    const { the, name } = furniture.find((f) => f.slug === anchor.slug)!;
    return { t: `${preposition[spot].t} ${the}`, en: `${preposition[spot].en} ${name.en}` };
  },
  fetch(thing, where, variant) {
    const { the } = thingOf(thing);
    return variant === 0
      ? { t: `Kan du ge mig ${the} ${where.t}?`, en: `Can you give me ${thing.name.en} ${where.en}?` }
      : { t: `Jag behöver ${the} ${where.t}.`, en: `I need ${thing.name.en} ${where.en}.` };
  },
  ask(thing) {
    return { t: `Var är min ${thingOf(thing).a}?`, en: `Where is my ${thing.name.en.replace(/^the /, "")}?` };
  },
  notThere(_thing, where) {
    return { t: `${capital(where.t)}? Där är den inte.`, en: `${capital(where.en)}? It isn't there.` };
  },
  found(where) {
    return { t: `Åh, ${where.t}! Tack, vad snällt!`, en: `Oh, ${where.en}! Thanks, how kind!` };
  },
  wrong(want, got) {
    const wantWhere = home.where(want.spot, want.anchor);
    if (want.thing.slug === got.thing.slug) {
      const gotWhere = home.where(got.spot, got.anchor);
      return {
        t: `Nej, det där är ${thingOf(got.thing).the} ${gotWhere.t}. Jag behöver ${thingOf(want.thing).the} ${wantWhere.t}.`,
        en: `No, that's ${got.thing.name.en} ${gotWhere.en}. I need ${want.thing.name.en} ${wantWhere.en}.`,
      };
    }
    return {
      t: `Men det där är ju ${thingOf(got.thing).the}! Jag behöver ${thingOf(want.thing).the} ${wantWhere.t}.`,
      en: `But that's ${got.thing.name.en}! I need ${want.thing.name.en} ${wantWhere.en}.`,
    };
  },
  lines: {
    invite: { t: "Kan jag hjälpa till?", en: "Can I help?" },
    notYet: { t: "Lär dig några ord om huset först!", en: "Learn a few words about the house first!" },
    intro: [
      { t: "Vad bra att du kom!", en: "How good that you came!" },
      { t: "I kväll kommer min familj på middag.", en: "My family is coming for dinner tonight." },
      { t: "Men jag hittar inte mina saker! Snälla, hjälp mig.", en: "But I can't find my things! Please help me." },
    ],
    tellIntro: { t: "Och när jag frågar: Var är …? Säg då var det är!", en: "And when I ask: Where is …? Then tell me where it is!" },
    title: { t: "Hemma hos Maja", en: "At Maja's" },
    howTo: { t: "Klicka på sakerna och ge dem till Maja.", en: "Click the things and give them to Maja." },
    tell: { t: "Säg till Maja var det är!", en: "Tell Maja where it is!" },
    clock: { t: "Familjen kommer!", en: "The family is coming!" },
    repeat: { t: "Förlåt?", en: "Pardon?" },
    thanks: [
      { t: "Tack, du är snäll!", en: "Thanks, you're kind!" },
      { t: "Underbart, tack!", en: "Wonderful, thanks!" },
      { t: "Toppen, tack så mycket!", en: "Great, thanks a lot!" },
    ],
    late: { t: "Åh nej, familjen är redan här!", en: "Oh no, the family's already here!" },
    done: [
      { t: "Allt hittat! Du är en pärla!", en: "Everything found! You're a gem!" },
      { t: "Tack! Allt är här.", en: "Thanks! Everything's here." },
      { t: "Puh, familjen är här. Tack ändå!", en: "Phew, the family's here. Thanks anyway!" },
    ],
    harder: { t: "I morgon letar jag efter ännu fler saker!", en: "Tomorrow I'll look for even more things!" },
    again: { t: "En gång till!", en: "Once more!" },
    back: { t: "Tillbaka till byn", en: "Back to the village" },
  },
};
