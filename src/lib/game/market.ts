import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// Helping at the market stall. Customers ask for fruit and vegetables by the
// piece or by the kilo; asking "anything else?" draws out the rest of their
// order; then you tell them the price from the till in words and take cash or
// card as they ask. From the third level some want clothes in a colour, and
// later the first one you hand over is too small or too big.

export type ProduceModel = "apple" | "pear" | "banana" | "onion" | "cherry" | "strawberry" | "tomato" | "potato" | "carrot";
export type ClothingModel = "shirt" | "tshirt" | "trousers" | "skirt" | "dress" | "jacket" | "pullover" | "coat" | "hat" | "beanie" | "scarf";
export type Size = "small" | "large";
export type Payment = "cash" | "card";

// By the piece (Äpfel, Birnen) or by the half kilo scoop (Kirschen, Tomaten).
export type Produce = { slug: string; model: ProduceModel; name: Line; by: "piece" | "kilo"; cents: number; color: string };
export type Clothing = { slug: string; model: ClothingModel; name: Line; sized: boolean; cents: number };
export type Colour = { slug: string; name: Line; hex: string };

// What a customer wants of one thing: so many pieces, or so many half kilos.
export type Amount = { produce: Produce; n: number };
export type Basket = Record<string, number>;

export type MarketConfig = {
  host: VillagerId;
  produce: Produce[];
  clothes: Clothing[];
  colours: Colour[];
  // Number concepts by value, 1 to 12 and the tens used for clothes.
  numbers: Record<number, string>;
  kilo: string;
  halfKilo: string | null;
  frames: { take: string; anythingElse: string; thatsAll: string; costs: string; euro: string; cash: string; card: string; tooSmall: string; tooBig: string; lookFor: string };
  // "Ich nehme drei Äpfel." / "Ein Kilo Kirschen, bitte." in a couple of ways.
  order(amount: Amount, variant: number): Line;
  // "Ich suche einen roten Pullover."
  ask(item: Clothing, colour: Colour): Line;
  // "Der ist zu klein." — said of the piece by its gender.
  wrongSize(item: Clothing, size: Size): Line;
  fits(item: Clothing): Line;
  pay(payment: Payment): Line;
  wrongPay(payment: Payment): Line;
  price(cents: number): Line;
  // Words to cents; "digits" when the learner wrote numbers instead of words.
  parsePrice(text: string, code: TargetLanguageCode): number | "digits" | null;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    clothesIntro: Line;
    title: Line;
    clock: Line;
    hello: Line[];
    yes: Line;
    thatsAll: Line;
    wrongBasket: Line;
    notThat: Line;
    whatCosts: Line;
    tellPrice: Line;
    priceWrong: Line;
    words: Line;
    payHow: Line;
    thanks: Line[];
    anythingElse: Line;
    repeat: Line;
    basket: Line;
    empty: Line;
    till: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
  };
};

export type MarketLevel = {
  customers: number;
  // Up to this many things per produce order; the rest come after "anything else?".
  parts: 1 | 2 | 3;
  kilos: boolean;
  price: boolean;
  payment: boolean;
  clothes: boolean;
  sizes: boolean;
  heard: boolean;
  seconds: number;
};

export const MARKET_LEVELS: MarketLevel[] = [
  { customers: 3, parts: 1, kilos: false, price: false, payment: false, clothes: false, sizes: false, heard: false, seconds: 130 },
  { customers: 4, parts: 2, kilos: true, price: true, payment: false, clothes: false, sizes: false, heard: false, seconds: 190 },
  { customers: 4, parts: 2, kilos: true, price: true, payment: true, clothes: true, sizes: false, heard: false, seconds: 210 },
  { customers: 5, parts: 2, kilos: true, price: true, payment: true, clothes: true, sizes: true, heard: true, seconds: 240 },
  { customers: 6, parts: 3, kilos: true, price: true, payment: true, clothes: true, sizes: true, heard: true, seconds: 260 },
];

export function marketLevel(index: number) {
  return MARKET_LEVELS[Math.max(0, Math.min(MARKET_LEVELS.length - 1, index))];
}

// What a clothes shopper wants. The size is theirs; you only find out by
// "too small" or "too big" once they try it on.
export type ClothesWish = { item: Clothing; colour: Colour; size: Size };
export type RailItem = { item: Clothing; colour: Colour; size: Size };

export type Customer =
  | { kind: "produce"; parts: Array<{ amount: Amount; line: Line }>; payment: Payment; cents: number }
  | { kind: "clothes"; wish: ClothesWish; line: Line; rail: RailItem[]; payment: Payment; cents: number };

export type MarketOptions = {
  level: MarketLevel;
  // What the learner has met; nothing else comes up.
  produce: string[];
  numbers: number[];
  kilos: boolean;
  price: boolean;
  payment: boolean;
  clothes: string[];
  colours: string[];
  sizes: boolean;
  weight?: (slug: string) => number;
  seed: number;
};

function weightedPick<T>(items: T[], weight: (item: T) => number, random: () => number) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

// Who asks for a piece of clothing is fixed by what they ask for, so each
// wish is recorded in one voice.
export function clothesGender(item: Clothing, colour: Colour): "man" | "woman" {
  const key = `${item.slug}:${colour.slug}`;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return item.model === "skirt" || item.model === "dress" ? "woman" : h % 2 ? "woman" : "man";
}

// The rail while a shopper looks: what they want (in both sizes once sizes
// matter), the same piece in other colours and other pieces in their colour.
export function railFor(wish: ClothesWish, options: { clothes: Clothing[]; colours: Colour[]; sizes: boolean }, random: () => number): RailItem[] {
  const { item, colour } = wish;
  const otherColours = options.colours.filter((c) => c.slug !== colour.slug);
  const otherItems = options.clothes.filter((c) => c.slug !== item.slug);
  const pick = <T>(list: T[]) => list.splice(Math.floor(random() * list.length), 1)[0];
  const rail: RailItem[] = options.sizes
    ? [{ item, colour, size: "small" }, { item, colour, size: "large" }]
    : [{ item, colour, size: wish.size }];
  const colours = [...otherColours];
  const items = [...otherItems];
  for (let i = 0; i < 2 && colours.length; i++) rail.push({ item, colour: pick(colours), size: random() < 0.5 ? "small" : "large" });
  for (let i = 0; i < 2 && items.length; i++) rail.push({ item: pick(items), colour, size: random() < 0.5 ? "small" : "large" });
  if (items.length && otherColours.length) rail.push({ item: pick(items), colour: otherColours[Math.floor(random() * otherColours.length)], size: "large" });
  // Shuffled, so the right one isn't always first.
  for (let i = rail.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rail[i], rail[j]] = [rail[j], rail[i]];
  }
  return rail;
}

// How much an amount costs.
export const amountCents = (a: Amount) => a.n * (a.produce.by === "kilo" ? a.produce.cents / 2 : a.produce.cents);

export function makeCustomers(config: MarketConfig, options: MarketOptions): Customer[] {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const { level } = options;
  const produce = config.produce.filter((p) => options.produce.includes(p.slug) && (p.by === "piece" || (level.kilos && options.kilos)));
  const counts = options.numbers.filter((n) => n >= 1 && n <= 5);
  const clothes = config.clothes.filter((c) => options.clothes.includes(c.slug));
  const colours = config.colours.filter((c) => options.colours.includes(c.slug));
  const canClothes = level.clothes && clothes.length >= 2 && colours.length >= 2;
  const customers: Customer[] = [];
  for (let i = 0; i < level.customers && produce.length; i++) {
    const payment: Payment = random() < 0.5 ? "cash" : "card";
    // About every other customer from the third level wants clothes, never the first.
    if (canClothes && i > 0 && random() < 0.45) {
      const item = weightedPick(clothes, (c) => weight(c.slug), random);
      const colour = weightedPick(colours, (c) => weight(c.slug), random);
      const sizes = level.sizes && options.sizes && item.sized;
      const wish: ClothesWish = { item, colour, size: random() < 0.5 ? "small" : "large" };
      const rail = railFor(wish, { clothes, colours, sizes }, random);
      customers.push({ kind: "clothes", wish, line: config.ask(item, colour), rail, payment, cents: item.cents });
      continue;
    }
    const wanted = 1 + Math.floor(random() * level.parts);
    const left = [...produce];
    const parts: Array<{ amount: Amount; line: Line }> = [];
    for (let k = 0; k < Math.min(wanted, left.length); k++) {
      const p = weightedPick(left, (x) => weight(x.slug), random);
      left.splice(left.indexOf(p), 1);
      // Half kilos: one, two or four scoops (ein halbes, ein, zwei Kilo).
      const kiloOptions = [1, 2, 4].filter((n) => n !== 1 || config.halfKilo);
      const n = p.by === "kilo" ? kiloOptions[Math.floor(random() * kiloOptions.length)] : counts.length ? counts[Math.floor(random() * counts.length)] : 1;
      const amount = { produce: p, n };
      parts.push({ amount, line: config.order(amount, Math.floor(random() * 2)) });
    }
    // Totals stay under thirteen euros, so they can be said with the numbers taught.
    while (parts.length > 1 && parts.reduce((s, p) => s + amountCents(p.amount), 0) > 1250) parts.pop();
    customers.push({ kind: "produce", parts, payment, cents: parts.reduce((s, p) => s + amountCents(p.amount), 0) });
  }
  return customers;
}

// What's wrong with the basket against the parts asked for so far.
export function checkBasket(asked: Amount[], basket: Basket) {
  const want = new Map(asked.map((a) => [a.produce.slug, a.n]));
  const problems: string[] = [];
  for (const slug of new Set([...want.keys(), ...Object.keys(basket)])) if ((basket[slug] ?? 0) !== (want.get(slug) ?? 0)) problems.push(slug);
  return problems;
}

export function marketStars(served: number, customers: number, timeLeft: number) {
  if (served >= customers) return timeLeft >= 0.2 ? 3 : 2;
  return served >= customers / 2 ? 1 : 0;
}

// The till's display: "4,50 €".
export function tillText(cents: number) {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")} €`;
}

// Every price a customer can owe.
export function allPrices(config: MarketConfig) {
  const prices = new Set<number>(config.clothes.map((c) => c.cents));
  for (let c = 50; c <= 1250; c += 50) prices.add(c);
  return [...prices].sort((a, b) => a - b);
}

// Everything the stall can say, for the gloss audit and the voice catalog.
export function allMarketLines(config: MarketConfig): Line[] {
  const lines: Line[] = [];
  for (const p of config.produce) {
    const ns = p.by === "kilo" ? [1, 2, 4] : [1, 2, 3, 4, 5];
    for (const n of ns) lines.push(config.order({ produce: p, n }, 0), config.order({ produce: p, n }, 1));
  }
  for (const item of config.clothes) {
    for (const colour of config.colours) lines.push(config.ask(item, colour));
    lines.push(config.wrongSize(item, "small"), config.wrongSize(item, "large"), config.fits(item));
  }
  for (const payment of ["cash", "card"] as Payment[]) lines.push(config.pay(payment), config.wrongPay(payment));
  for (const cents of allPrices(config)) lines.push(config.price(cents));
  return lines;
}
