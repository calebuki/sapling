import type { CafeConfig, CafeItem } from "@/lib/game/cafe";
import type { OrderPart, RushConfig } from "@/lib/game/rush";
import { spoken } from "@/lib/game/line";

// Café Kuckuck's counter. Franz teaches here: the menu board, orders that land
// on your tray, and the odd mix-up for you to sort out. German articles change
// with the job a noun does, so each item carries the forms the counter needs.

type Forms = { nom: string; acc: string; neg: string; poss: string; en: string };

const forms: Record<string, Forms> = {
  kaffee: { nom: "ein Kaffee", acc: "einen Kaffee", neg: "keinen Kaffee", poss: "dein Kaffee", en: "a coffee" },
  tee: { nom: "ein Tee", acc: "einen Tee", neg: "keinen Tee", poss: "dein Tee", en: "a tea" },
  brezel: { nom: "eine Brezel", acc: "eine Brezel", neg: "keine Brezel", poss: "deine Brezel", en: "a pretzel" },
  kuchen: { nom: "ein Stück Kuchen", acc: "ein Stück Kuchen", neg: "keinen Kuchen", poss: "dein Kuchen", en: "a piece of cake" },
  saft: { nom: "ein Saft", acc: "einen Saft", neg: "keinen Saft", poss: "dein Saft", en: "a juice" },
  milch: { nom: "Milch", acc: "Milch", neg: "keine Milch", poss: "deine Milch", en: "milk" },
  wasser: { nom: "ein Wasser", acc: "ein Wasser", neg: "kein Wasser", poss: "dein Wasser", en: "a water" },
};

const of = (item: CafeItem) => forms[item.slug];
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const euros = (price: number) => price.toFixed(2).replace(".", ",");

// Two of something, the way a café counter says it: "zwei Kaffee", "zwei Brezeln".
const two: Record<string, { t: string; en: string }> = {
  kaffee: { t: "zwei Kaffee", en: "two coffees" },
  tee: { t: "zwei Tee", en: "two teas" },
  brezel: { t: "zwei Brezeln", en: "two pretzels" },
  kuchen: { t: "zwei Stück Kuchen", en: "two pieces of cake" },
  saft: { t: "zwei Säfte", en: "two juices" },
  milch: { t: "zwei Glas Milch", en: "two glasses of milk" },
  wasser: { t: "zwei Wasser", en: "two waters" },
};

function phrase(part: OrderPart) {
  const base = part.count === 2 ? two[part.item] : { t: forms[part.item].acc, en: forms[part.item].en };
  return part.with ? { t: `${base.t} mit Milch`, en: `${base.en} with milk` } : base;
}

const rush: RushConfig = {
  kitchen: ["brezel", "kuchen"],
  modifier: { item: "milch", concept: "mit-milch", on: ["kaffee", "tee"] },
  quantity: { concept: "zwei", words: ["zwei", "2"] },
  and: { t: "und", en: "and" },
  phrase,
  openers: [
    { t: "Ich hätte gern {x}.", en: "I'd like {x}." },
    { t: "{X}, bitte.", en: "{X}, please." },
    { t: "Ich möchte {x}, bitte.", en: "I'd like {x}, please." },
  ],
  changeMind: { t: "{X}, bitte … ach nein, doch lieber {y}!", en: "{X}, please… oh no, {y} instead!" },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Sachen von der Karte!", en: "First learn a few things on the menu!" },
    intro: [
      { t: "Oh, danke! Heute ist so viel los!", en: "Oh, thanks! It's so busy today!" },
      { t: "Die Gäste bestellen an der Theke. Hör gut zu!", en: "The guests order at the counter. Listen carefully!" },
      { t: "Brezeln und Kuchen mache ich in der Küche. Sag mir einfach, was du brauchst!", en: "I make the pretzels and cake in the kitchen. Just tell me what you need!" },
    ],
    title: { t: "Schicht im Café", en: "Shift at the café" },
    guests: { t: "Gäste", en: "guests" },
    till: { t: "Kasse", en: "till" },
    tips: { t: "Trinkgeld", en: "tips" },
    howTo: { t: "Klick auf die Sachen hinter der Theke, dann auf den Gast.", en: "Click the things behind the counter, then the guest." },
    kitchenAsk: { t: "Was brauchst du?", en: "What do you need?" },
    kitchenHuh: { t: "Wie bitte? Was brauchst du?", en: "Pardon? What do you need?" },
    kitchenNotHere: { t: "Das machst du selbst, da drüben!", en: "You make that yourself, over there!" },
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    thanks: [
      { t: "Danke schön!", en: "Thank you!" },
      { t: "Super, danke!", en: "Great, thanks!" },
      { t: "Perfekt, vielen Dank!", en: "Perfect, thanks a lot!" },
    ],
    angry: { t: "Das dauert zu lange. Tschüss!", en: "This is taking too long. Bye!" },
    done: [
      { t: "Wow, du bist ein Profi!", en: "Wow, you're a pro!" },
      { t: "Gut gemacht, danke!", en: "Well done, thanks!" },
      { t: "Puh, geschafft! Danke für die Hilfe.", en: "Phew, done! Thanks for the help." },
    ],
    harder: { t: "Morgen kommen mehr Gäste!", en: "Tomorrow more guests are coming!" },
    again: { t: "Noch eine Schicht!", en: "Another shift!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
    trash: { t: "Tablett leeren", en: "Empty the tray" },
    ask: { t: "Sag es Franz!", en: "Tell Franz!" },
  },
  kitchenGive(parts) {
    const said = parts.map(phrase);
    const t = said.map((p) => p.t).join(" und ");
    return { t: `${capital(t)}? Kommt sofort!`, en: `${capital(said.map((p) => p.en).join(" and "))}? Coming right up!` };
  },
  // Two clips, so every mix-up is covered by one recording per item and voice.
  wrong(want, got) {
    return spoken([`${capital(of(got).neg)}!`, `Ich wollte ${of(want).acc}.`], `Not ${of(got).en}! I wanted ${of(want).en}.`);
  },
  missing(want) {
    return { t: `Ich wollte auch ${of(want).acc}.`, en: `I wanted ${of(want).en} too.` };
  },
  extra(got) {
    return { t: `${capital(of(got).nom)}? Das habe ich nicht bestellt.`, en: `${capital(of(got).en)}? I didn't order that.` };
  },
};

export const cafe: CafeConfig = {
  menu: [
    { slug: "kaffee", name: "Kaffee", en: "coffee", price: 2.8, icon: "coffee" },
    { slug: "tee", name: "Tee", en: "tea", price: 2.5, icon: "tea" },
    { slug: "brezel", name: "Brezel", en: "pretzel", price: 1.2, icon: "pretzel" },
    { slug: "kuchen", name: "Kuchen", en: "cake", price: 3.5, icon: "cake" },
    { slug: "saft", name: "Saft", en: "juice", price: 2.9, icon: "juice" },
    { slug: "milch", name: "Milch", en: "milk", price: 0.5, icon: "milk" },
    { slug: "wasser", name: "Wasser", en: "water", price: 0, icon: "water" },
  ],
  orderSlugs: ["ich-haette-gern", "ich-moechte", "mit-milch", "und-eine-brezel", "bestellen-getraenk", "bestellen-essen", "zahlen-bitte"],
  later: ["die-torte", "guten-appetit", "was-kostet", "das-macht"],
  orderVariants: {
    "ich-haette-gern": [
      { t: "Ich hätte gern einen Kaffee.", en: "I'd like a coffee." },
      { t: "Ich hätte gern einen Tee.", en: "I'd like a tea." },
      { t: "Ich hätte gern eine Brezel.", en: "I'd like a pretzel." },
      { t: "Ich hätte gern ein Wasser.", en: "I'd like a water." },
    ],
    "ich-moechte": [
      { t: "Ich möchte einen Kaffee.", en: "I'd like a coffee." },
      { t: "Ich möchte ein Stück Kuchen.", en: "I'd like a piece of cake." },
      { t: "Ich möchte einen Saft.", en: "I'd like a juice." },
    ],
    "mit-milch": [
      { t: "Einen Kaffee mit Milch, bitte.", en: "A coffee with milk, please." },
      { t: "Einen Tee mit Milch, bitte.", en: "A tea with milk, please." },
    ],
    "und-eine-brezel": [{ t: "Und eine Brezel, bitte.", en: "And a pretzel, please." }],
    "bestellen-getraenk": [
      { t: "Ich hätte gern einen Kaffee mit Milch, bitte.", en: "Order a coffee with milk.", accept: ["^(ich hätte gern|ich möchte|ich nehme) .*kaffee.*milch"] },
      { t: "Ich hätte gern einen Tee, bitte.", en: "Order a tea.", accept: ["^(ich hätte gern|ich möchte|ich nehme) (einen )?tee\\b"] },
      { t: "Ich hätte gern einen Saft, bitte.", en: "Order a juice.", accept: ["^(ich hätte gern|ich möchte|ich nehme) (einen )?(apfel)?saft\\b"] },
    ],
    "bestellen-essen": [
      { t: "Und eine Brezel, bitte.", en: "Add a pretzel.", accept: ["\\bbrezel\\b"] },
      { t: "Und ein Stück Kuchen, bitte.", en: "Add a piece of cake.", accept: ["\\bkuchen\\b"] },
    ],
    "zahlen-bitte": [{ t: "Ich möchte bitte zahlen.", en: "Ask to pay.", accept: ["^(ich möchte (bitte )?zahlen|zahlen bitte|die rechnung bitte)\\b"] }],
  },
  trayOrders: [
    { t: "Einen Kaffee und eine Brezel, bitte.", en: "A coffee and a pretzel, please.", items: ["kaffee", "brezel"] },
    { t: "Einen Tee mit Milch, bitte.", en: "A tea with milk, please.", items: ["tee", "milch"] },
    { t: "Ich hätte gern ein Wasser und ein Stück Kuchen.", en: "I'd like a water and a piece of cake.", items: ["wasser", "kuchen"] },
    { t: "Ich möchte einen Saft und eine Brezel.", en: "I'd like a juice and a pretzel.", items: ["saft", "brezel"] },
    { t: "Einen Kaffee mit Milch, bitte.", en: "A coffee with milk, please.", items: ["kaffee", "milch"] },
    { t: "Nur ein Glas Wasser, bitte.", en: "Just a glass of water, please.", items: ["wasser"] },
    { t: "Zwei Brezeln und einen Tee.", en: "Two pretzels and a tea.", items: ["brezel", "tee"] },
  ],
  orderExchange: {
    situation: "You're ordering at the counter of Café Kuckuck.",
    speaker: "Franz",
    cue: { t: "Hallo! Was darf's sein?", en: "Hi! What can I get you?" },
    reaction: { t: "Bitte schön! Lass es dir schmecken.", en: "Here you go! Enjoy." },
  },
  billExchange: {
    situation: "You've finished your coffee and cake at Café Kuckuck.",
    speaker: "Franz",
    cue: { t: "Hat es geschmeckt?", en: "Did you enjoy it?" },
    reaction: { t: "Das macht sieben Euro zwanzig, bitte.", en: "That's seven euros twenty, please." },
  },
  billSlug: "zahlen-bitte",
  lines: {
    sorry: { t: "Oh, Entschuldigung! Bitte schön.", en: "Oh, sorry! Here you go." },
    served: { t: "Bitte schön!", en: "Here you go!" },
    whatIsThis: { t: "Was ist das?", en: "What is this?" },
    tapWhatYouHear: { t: "Zeig auf das, was Franz sagt!", en: "Point at what Franz says!" },
    howToOrder: { t: "So bestellt man:", en: "This is how you order:" },
    orderThis: { t: "Bestell das!", en: "Order this!" },
    menu: { t: "Karte", en: "Menu" },
    oops: { t: "Franz macht einen Fehler!", en: "Franz gets it wrong!" },
  },
  withArticle: (item) => of(item).nom,
  introduce(item) {
    return { t: `Das ist ${of(item).nom}!`, en: `This is ${of(item).en}!` };
  },
  price(item) {
    return item.price === 0 ? { t: "gratis", en: "free" } : { t: `${euros(item.price)} €`, en: `${euros(item.price).replace(",", ".")} euros` };
  },
  serve(item) {
    return { t: `Bitte schön, ${of(item).poss}!`, en: `Here you go, your ${item.en}!` };
  },
  checkOrder(item) {
    return { t: `Hmm, du hast doch ${of(item).acc} bestellt, oder?`, en: `Hmm, you ordered ${of(item).en}, didn't you?` };
  },
  fixOptions(want, got, decoy) {
    return [
      { t: capital(`nein, ich wollte ${of(want).acc}, ${of(got).neg}.`), en: `No, I wanted ${want.en}, not ${got.en}.` },
      { t: "Danke, perfekt!", en: "Thanks, perfect!" },
      { t: capital(`nein, ich wollte ${of(decoy).acc}, ${of(got).neg}.`), en: `No, I wanted ${decoy.en}, not ${got.en}.` },
    ];
  },
  rush,
};
