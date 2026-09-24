import { normalizeSwedish } from "@/lib/learning/adaptive";
import type { Line } from "./villagers";

// Café Kanel's counter. Bosse's lessons happen here: items on the menu board,
// orders that land on your tray, and the odd mix-up for you to fix.

export type CafeIcon = "coffee" | "tea" | "water" | "milk" | "bun";
export type CafeItem = { slug: string; sv: string; en: string; article: "en" | "ett" | null; price: number; icon: CafeIcon };

export const cafeMenu: CafeItem[] = [
  { slug: "kaffe", sv: "kaffe", en: "coffee", article: "en", price: 25, icon: "coffee" },
  { slug: "te", sv: "te", en: "tea", article: "ett", price: 20, icon: "tea" },
  { slug: "kanelbulle", sv: "kanelbulle", en: "cinnamon bun", article: "en", price: 30, icon: "bun" },
  { slug: "mjoelk", sv: "mjölk", en: "milk", article: null, price: 5, icon: "milk" },
  { slug: "vatten", sv: "vatten", en: "water", article: null, price: 0, icon: "water" },
];

// Phrases that are ways of ordering; everything else Bosse teaches is plain talk.
export const orderSlugs = new Set(["jag-skulle-vilja", "med-mjoelk", "och-en-kanelbulle", "vill-ha", "cafe-order-drink", "cafe-order-food", "cafe-ask-bill"]);

export function cafeItem(slug: string) {
  return cafeMenu.find((item) => item.slug === slug) ?? null;
}

// "en kaffe", "ett te", but plain "mjölk" and "vatten".
export function withArticle(item: CafeItem) {
  return item.article ? `${item.article} ${item.sv}` : item.sv;
}

// Menu items a (possibly half-built) order mentions, in the order they're said.
export function itemsIn(text: string): CafeItem[] {
  const words = normalizeSwedish(text).split(" ");
  return words.flatMap((word) => cafeMenu.filter((item) => normalizeSwedish(item.sv) === word));
}

export function introduceLine(item: CafeItem): Line {
  const sv = `Det här är ${withArticle(item)}!`;
  return { sv: sv.charAt(0).toUpperCase() + sv.slice(1), en: `This is ${item.article ? "a " : ""}${item.en}!` };
}

export function priceLine(item: CafeItem): Line {
  return item.price === 0 ? { sv: "gratis", en: "free" } : { sv: `${item.price} kr`, en: `${item.price} kronor` };
}

// Bosse serves the wrong thing; the learner has to put it right.
export function mixUp(want: CafeItem, seed: number) {
  const others = cafeMenu.filter((item) => item.slug !== want.slug);
  const got = others[seed % others.length];
  const decoy = others[(seed + 1) % others.length];
  const serve: Line = { sv: `Varsågod, ${withArticle(got)}!`, en: `Here you go, ${got.article ? "a " : ""}${got.en}!` };
  const options = [
    { sv: `Nej, jag vill ha ${want.sv}, inte ${got.sv}.`, en: `No, I want ${want.en}, not ${got.en}.`, right: true },
    { sv: "Tack, perfekt!", en: "Thanks, perfect!", right: false },
    { sv: `Nej, jag vill ha ${decoy.sv}, inte ${got.sv}.`, en: `No, I want ${decoy.en}, not ${got.en}.`, right: false },
  ];
  return { got, serve, options };
}

export const cafeLines = {
  sorry: { sv: "Oj, förlåt! Varsågod.", en: "Oops, sorry! Here you go." },
  checkOrder: (want: CafeItem): Line => ({ sv: `Hmm, du beställde väl ${withArticle(want)}?`, en: `Hmm, you ordered ${want.en}, didn't you?` }),
  served: { sv: "Varsågod!", en: "Here you go!" },
  whatIsThis: { sv: "Vad är det här?", en: "What is this?" },
  tapWhatYouHear: { sv: "Peka på det Bosse säger!", en: "Point at what Bosse says!" },
  howToOrder: { sv: "Så här beställer man:", en: "This is how you order:" },
  orderThis: { sv: "Beställ det här!", en: "Order this!" },
  yourTray: { sv: "Din bricka", en: "Your tray" },
  menu: { sv: "Meny", en: "Menu" },
  oops: { sv: "Bosse gör fel!", en: "Bosse gets it wrong!" },
} satisfies Record<string, Line | ((item: CafeItem) => Line)>;

// Several ways each order phrase comes up, so the same ticket rarely repeats.
// Each variant is a complete right answer; `accept` lets looser natural orders through.
export const orderVariants: Record<string, Array<{ sv: string; en: string; accept?: string[] }>> = {
  "jag-skulle-vilja": [
    { sv: "Jag skulle vilja ha en kaffe.", en: "I would like a coffee." },
    { sv: "Jag skulle vilja ha ett te.", en: "I would like a tea." },
    { sv: "Jag skulle vilja ha en kanelbulle.", en: "I would like a cinnamon bun." },
    { sv: "Jag skulle vilja ha vatten.", en: "I would like water." },
  ],
  "vill-ha": [
    { sv: "Jag vill ha kaffe.", en: "I want coffee." },
    { sv: "Jag vill ha te.", en: "I want tea." },
    { sv: "Jag vill ha en kanelbulle.", en: "I want a cinnamon bun." },
  ],
  "med-mjoelk": [
    { sv: "En kaffe med mjölk.", en: "A coffee with milk." },
    { sv: "Ett te med mjölk.", en: "A tea with milk." },
  ],
  "och-en-kanelbulle": [{ sv: "Och en kanelbulle, tack.", en: "And a cinnamon bun, please." }],
  "cafe-order-drink": [
    { sv: "Jag skulle vilja ha en kaffe med mjölk, tack.", en: "Order a coffee with milk.", accept: ["^(jag skulle vilja ha|jag vill ha|kan jag få) .*kaffe.*mjölk"] },
    { sv: "Jag skulle vilja ha ett te, tack.", en: "Order a tea.", accept: ["^(jag skulle vilja ha|jag vill ha|kan jag få) (ett )?te\\b"] },
    { sv: "Jag skulle vilja ha vatten, tack.", en: "Order some water.", accept: ["^(jag skulle vilja ha|jag vill ha|kan jag få) (ett glas )?vatten\\b"] },
  ],
  "cafe-order-food": [{ sv: "Och en kanelbulle, tack.", en: "Add a cinnamon bun.", accept: ["\\b(en )?kanelbulle\\b"] }],
  "cafe-ask-bill": [{ sv: "Kan jag få notan, tack?", en: "Ask for the bill.", accept: ["^(kan jag få notan|notan tack)\\b"] }],
};

// Spoken orders for the tray drill: listen to a customer, fill their tray.
export const trayOrders: Array<{ sv: string; en: string; items: string[] }> = [
  { sv: "En kaffe och en kanelbulle, tack.", en: "A coffee and a cinnamon bun, please.", items: ["kaffe", "kanelbulle"] },
  { sv: "Ett te med mjölk, tack.", en: "A tea with milk, please.", items: ["te", "mjoelk"] },
  { sv: "Jag skulle vilja ha vatten och en kanelbulle.", en: "I would like water and a cinnamon bun.", items: ["vatten", "kanelbulle"] },
  { sv: "Jag vill ha ett te och en kaffe.", en: "I want a tea and a coffee.", items: ["te", "kaffe"] },
  { sv: "En kaffe med mjölk, tack.", en: "A coffee with milk, please.", items: ["kaffe", "mjoelk"] },
  { sv: "Bara ett glas vatten, tack.", en: "Just a glass of water, please.", items: ["vatten"] },
  { sv: "Två kanelbullar och ett te.", en: "Two cinnamon buns and a tea.", items: ["kanelbulle", "te"] },
];
