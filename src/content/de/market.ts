import { spoken } from "@/lib/game/line";
import type { Amount, Clothing, Colour, MarketConfig, Produce } from "@/lib/game/market";
import { normalizeText } from "@/lib/learning/text";

// Marie's stall on the market square. Fruit and vegetables go by the piece
// (Äpfel, Birnen) or by the kilo (Kirschen, Tomaten); clothes are asked for
// with a colour, which takes the accusative ending: einen roten Pullover,
// eine rote Jacke, ein rotes Kleid.

type Gender = "m" | "f" | "n";
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const produce: Array<Produce & { gender: Gender; one: string; many: string }> = [
  { slug: "der-apfel", model: "apple", name: { t: "der Apfel", en: "apple" }, by: "piece", cents: 50, color: "#d64545", gender: "m", one: "Apfel", many: "Äpfel" },
  { slug: "die-birne", model: "pear", name: { t: "die Birne", en: "pear" }, by: "piece", cents: 50, color: "#b8c94a", gender: "f", one: "Birne", many: "Birnen" },
  { slug: "die-banane", model: "banana", name: { t: "die Banane", en: "banana" }, by: "piece", cents: 50, color: "#f4d03f", gender: "f", one: "Banane", many: "Bananen" },
  { slug: "die-zwiebel", model: "onion", name: { t: "die Zwiebel", en: "onion" }, by: "piece", cents: 50, color: "#c98a4b", gender: "f", one: "Zwiebel", many: "Zwiebeln" },
  { slug: "die-kirsche", model: "cherry", name: { t: "die Kirschen", en: "cherries" }, by: "kilo", cents: 400, color: "#9b1b30", gender: "f", one: "Kirsche", many: "Kirschen" },
  { slug: "die-erdbeere", model: "strawberry", name: { t: "die Erdbeeren", en: "strawberries" }, by: "kilo", cents: 400, color: "#e74c3c", gender: "f", one: "Erdbeere", many: "Erdbeeren" },
  { slug: "die-tomate", model: "tomato", name: { t: "die Tomaten", en: "tomatoes" }, by: "kilo", cents: 300, color: "#e5533c", gender: "f", one: "Tomate", many: "Tomaten" },
  { slug: "die-kartoffel", model: "potato", name: { t: "die Kartoffeln", en: "potatoes" }, by: "kilo", cents: 200, color: "#c9a46a", gender: "f", one: "Kartoffel", many: "Kartoffeln" },
  { slug: "die-karotte", model: "carrot", name: { t: "die Karotten", en: "carrots" }, by: "kilo", cents: 200, color: "#e67e22", gender: "f", one: "Karotte", many: "Karotten" },
];

const clothes: Array<Clothing & { gender: Gender; noun: string }> = [
  { slug: "das-hemd", model: "shirt", name: { t: "das Hemd", en: "shirt" }, sized: true, cents: 3000, gender: "n", noun: "Hemd" },
  { slug: "das-t-shirt", model: "tshirt", name: { t: "das T-Shirt", en: "T-shirt" }, sized: true, cents: 2000, gender: "n", noun: "T-Shirt" },
  { slug: "die-hose", model: "trousers", name: { t: "die Hose", en: "trousers" }, sized: true, cents: 4000, gender: "f", noun: "Hose" },
  { slug: "der-rock", model: "skirt", name: { t: "der Rock", en: "skirt" }, sized: true, cents: 3000, gender: "m", noun: "Rock" },
  { slug: "das-kleid", model: "dress", name: { t: "das Kleid", en: "dress" }, sized: true, cents: 5000, gender: "n", noun: "Kleid" },
  { slug: "die-jacke", model: "jacket", name: { t: "die Jacke", en: "jacket" }, sized: true, cents: 5000, gender: "f", noun: "Jacke" },
  { slug: "der-pullover", model: "pullover", name: { t: "der Pullover", en: "sweater" }, sized: true, cents: 4000, gender: "m", noun: "Pullover" },
  { slug: "der-mantel", model: "coat", name: { t: "der Mantel", en: "coat" }, sized: true, cents: 6000, gender: "m", noun: "Mantel" },
  { slug: "der-hut", model: "hat", name: { t: "der Hut", en: "hat" }, sized: false, cents: 2000, gender: "m", noun: "Hut" },
  { slug: "die-muetze", model: "beanie", name: { t: "die Mütze", en: "woolly hat" }, sized: false, cents: 1000, gender: "f", noun: "Mütze" },
  { slug: "der-schal", model: "scarf", name: { t: "der Schal", en: "scarf" }, sized: false, cents: 2000, gender: "m", noun: "Schal" },
];

// Rosa, lila and orange don't take endings.
const colours: Array<Colour & { stem: string; plain?: boolean }> = [
  { slug: "rot", name: { t: "rot", en: "red" }, hex: "#c0392b", stem: "rot" },
  { slug: "blau", name: { t: "blau", en: "blue" }, hex: "#2f6fb5", stem: "blau" },
  { slug: "gruen", name: { t: "grün", en: "green" }, hex: "#3f8f4f", stem: "grün" },
  { slug: "gelb", name: { t: "gelb", en: "yellow" }, hex: "#f2c230", stem: "gelb" },
  { slug: "weiss", name: { t: "weiß", en: "white" }, hex: "#f4f1ea", stem: "weiß" },
  { slug: "schwarz", name: { t: "schwarz", en: "black" }, hex: "#2b2b2b", stem: "schwarz" },
  { slug: "braun", name: { t: "braun", en: "brown" }, hex: "#7a4f2e", stem: "braun" },
  { slug: "grau", name: { t: "grau", en: "grey" }, hex: "#8a8f94", stem: "grau" },
  { slug: "rosa", name: { t: "rosa", en: "pink" }, hex: "#f4a3c1", stem: "rosa", plain: true },
  { slug: "lila", name: { t: "lila", en: "purple" }, hex: "#8e5bb5", stem: "lila", plain: true },
  { slug: "orange", name: { t: "orange", en: "orange" }, hex: "#e67e22", stem: "orange", plain: true },
];

const words = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
const english = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const tens: Record<number, [string, string]> = { 20: ["zwanzig", "twenty"], 30: ["dreißig", "thirty"], 40: ["vierzig", "forty"], 50: ["fünfzig", "fifty"], 60: ["sechzig", "sixty"] };

const produceOf = (p: Produce) => produce.find((x) => x.slug === p.slug)!;
const clothingOf = (c: Clothing) => clothes.find((x) => x.slug === c.slug)!;
const colourOf = (c: Colour) => colours.find((x) => x.slug === c.slug)!;

// "drei Äpfel", "einen Apfel", "ein Kilo Kirschen", "ein halbes Kilo Tomaten".
function amountOf(a: Amount) {
  const p = produceOf(a.produce);
  if (p.by === "kilo") {
    const kilo = a.n === 1 ? { t: "ein halbes Kilo", en: "half a kilo of" } : a.n === 2 ? { t: "ein Kilo", en: "a kilo of" } : { t: `${words[a.n / 2]} Kilo`, en: `${english[a.n / 2]} kilos of` };
    return { t: `${kilo.t} ${p.many}`, en: `${kilo.en} ${p.name.en}`, short: kilo };
  }
  if (a.n === 1) {
    const art = p.gender === "m" ? "einen" : "eine";
    return { t: `${art} ${p.one}`, en: `one ${p.name.en}`, short: { t: art, en: "one" } };
  }
  return { t: `${words[a.n]} ${p.many}`, en: `${english[a.n]} ${p.name.en}s`, short: { t: words[a.n], en: english[a.n] } };
}

// Accusative with ein: einen roten Rock, eine rote Hose, ein rotes Hemd.
function wish(item: Clothing, colour: Colour) {
  const c = clothingOf(item);
  const col = colourOf(colour);
  const ending = col.plain ? "" : c.gender === "m" ? "en" : c.gender === "f" ? "e" : "es";
  const article = c.gender === "m" ? "einen" : c.gender === "f" ? "eine" : "ein";
  return { t: `${article} ${col.stem}${ending} ${c.noun}`, en: `a ${col.name.en} ${c.name.en}` };
}

const pronoun = (item: Clothing) => ({ m: "der", f: "die", n: "das" })[clothingOf(item).gender];

function euros(cents: number) {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  const say = (n: number) => (n === 1 ? "einen" : n <= 12 ? words[n] : tens[n][0]);
  const en = (n: number) => (n <= 12 ? english[n] : tens[n][1]);
  if (!e) return { t: `${tens[c][0]} Cent`, en: `${tens[c][1]} cents` };
  return c ? { t: `${say(e)} Euro ${tens[c][0]}`, en: `${en(e)} euros ${tens[c][1]}` } : { t: `${say(e)} Euro`, en: `${en(e)} euro${e === 1 ? "" : "s"}` };
}

// Number words, matched with or without umlauts: fünf, fuenf and funf.
const fold = (w: string) => w.replace(/ä|ae/g, "a").replace(/ö|oe/g, "o").replace(/ü|ue/g, "u").replace(/ß/g, "ss");
const values: Record<string, number> = Object.fromEntries(
  [...words.map((w, i) => [w, i] as const), ["ein", 1] as const, ["einen", 1] as const, ["eine", 1] as const, ...Object.entries(tens).map(([n, [w]]) => [w, Number(n)] as const)].map(([w, n]) => [fold(w), n]),
);

export const market: MarketConfig = {
  host: "marie",
  produce,
  clothes,
  colours,
  numbers: { 1: "eins", 2: "zwei", 3: "drei", 4: "vier", 5: "fuenf", 6: "sechs", 7: "sieben", 8: "acht", 9: "neun", 10: "zehn", 11: "elf", 12: "zwoelf", 20: "zwanzig", 30: "dreissig", 40: "vierzig", 50: "fuenfzig", 60: "sechzig" },
  kilo: "das-kilo",
  halfKilo: "ein-halbes-kilo",
  frames: {
    take: "ich-nehme",
    anythingElse: "sonst-noch",
    thatsAll: "das-ist-alles",
    costs: "kostet",
    euro: "der-euro",
    cash: "bar",
    card: "mit-karte",
    tooSmall: "zu-klein",
    tooBig: "zu-gross",
    lookFor: "suchen",
  },
  // "Ich nehme drei Äpfel." or, in two clips, "Haben Sie Äpfel? Drei, bitte."
  order(amount, variant) {
    const a = amountOf(amount);
    const p = produceOf(amount.produce);
    if (variant === 0) return { t: `Ich nehme ${a.t}.`, en: `I'll take ${a.en}.` };
    return spoken([`Haben Sie ${p.many}?`, `${capital(a.short.t)}, bitte.`], `Do you have ${p.name.en}${p.by === "piece" ? "s" : ""}? ${capital(a.short.en)}, please.`);
  },
  ask(item, colour) {
    const w = wish(item, colour);
    return { t: `Ich suche ${w.t}.`, en: `I'm looking for ${w.en}.` };
  },
  wrongSize(item, size) {
    return size === "small" ? { t: `Hmm, ${pronoun(item)} ist zu klein.`, en: "Hmm, it's too small." } : { t: `Hmm, ${pronoun(item)} ist zu groß.`, en: "Hmm, it's too big." };
  },
  fits(item) {
    return spoken([`Perfekt, ${pronoun(item)} passt!`, "Das gefällt mir."], "Perfect, it fits! I like it.");
  },
  pay(payment) {
    return payment === "cash" ? { t: "Ich zahle bar.", en: "I'll pay cash." } : { t: "Kann ich mit Karte zahlen?", en: "Can I pay by card?" };
  },
  wrongPay(payment) {
    return payment === "cash" ? { t: "Nein, ich zahle bar!", en: "No, I'm paying cash!" } : { t: "Nein, mit Karte, bitte!", en: "No, by card, please!" };
  },
  price(cents) {
    const e = euros(cents);
    return { t: `Das kostet ${e.t}.`, en: `That costs ${e.en}.` };
  },
  parsePrice(text, code) {
    const said = normalizeText(text, code).split(" ").filter(Boolean);
    if (said.some((w) => /\d/.test(w))) return "digits";
    const numbers = said.map((w, i) => ({ n: values[fold(w)], i })).filter((x) => x.n !== undefined);
    const euro = said.findIndex((w) => w === "euro" || w === "euros");
    const cent = said.findIndex((w) => w === "cent");
    if (euro >= 0) {
      const before = numbers.filter((x) => x.i < euro).pop();
      const after = numbers.find((x) => x.i > euro);
      if (!before) return null;
      return before.n * 100 + (after?.n ?? 0);
    }
    if (cent >= 0) {
      const before = numbers.filter((x) => x.i < cent).pop();
      return before ? before.n : null;
    }
    // "vier fünfzig" means four euros fifty.
    if (numbers.length >= 2 && numbers[1].n === 50) return numbers[0].n * 100 + 50;
    return numbers.length ? numbers[0].n * 100 : null;
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Wörter zum Einkaufen!", en: "First learn a few words for shopping!" },
    intro: [
      { t: "Hallo! Heute ist Markttag, und ich habe so viel zu tun!", en: "Hi! It's market day today, and I have so much to do!" },
      { t: "Hör gut zu, was die Kunden möchten, und pack es in den Korb.", en: "Listen carefully to what the customers want, and put it in the basket." },
      { t: "Wenn du fertig bist, frag: Sonst noch etwas?", en: "When you're done, ask: anything else?" },
    ],
    clothesIntro: { t: "Und heute verkaufen wir auch Kleidung! Sie hängt rechts.", en: "And today we're selling clothes too! They're hanging on the right." },
    title: { t: "Der Marktstand", en: "The market stall" },
    clock: { t: "Der Markt schließt", en: "The market closes" },
    hello: [
      { t: "Guten Tag!", en: "Hello!" },
      { t: "Hallo, Marie!", en: "Hi, Marie!" },
      { t: "Guten Morgen!", en: "Good morning!" },
    ],
    yes: { t: "Ja, gern!", en: "Yes, please!" },
    thatsAll: { t: "Nein, danke. Das ist alles.", en: "No, thanks. That's all." },
    wrongBasket: { t: "Hmm, das stimmt nicht.", en: "Hmm, that's not right." },
    notThat: { t: "Nein, das nicht.", en: "No, not that." },
    whatCosts: { t: "Was kostet das?", en: "How much is that?" },
    tellPrice: { t: "Sag den Preis!", en: "Say the price!" },
    priceWrong: { t: "Schau noch mal auf die Kasse!", en: "Look at the till again!" },
    words: { t: "Sag es mit Wörtern!", en: "Say it in words!" },
    payHow: { t: "Bar oder mit Karte?", en: "Cash or card?" },
    thanks: [
      { t: "Danke schön! Tschüss!", en: "Thank you! Bye!" },
      { t: "Vielen Dank! Auf Wiedersehen!", en: "Thanks a lot! Goodbye!" },
      { t: "Super, danke!", en: "Great, thanks!" },
    ],
    anythingElse: { t: "Sonst noch etwas?", en: "Anything else?" },
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    basket: { t: "Der Korb", en: "The basket" },
    empty: { t: "Ausleeren", en: "Empty it" },
    till: { t: "Die Kasse", en: "The till" },
    late: { t: "Oh, der Markt ist schon zu!", en: "Oh, the market's already closed!" },
    done: [
      { t: "Alles verkauft! Du bist ein Schatz!", en: "Everything sold! You're a treasure!" },
      { t: "Gut gemacht! Fast alle sind zufrieden.", en: "Well done! Almost everyone is happy." },
      { t: "Puh, was für ein Tag! Morgen klappt es besser.", en: "Phew, what a day! Tomorrow will go better." },
    ],
    harder: { t: "Morgen ist noch mehr los!", en: "Tomorrow it'll be even busier!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
  },
};
