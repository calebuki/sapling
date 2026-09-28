import type { CafeConfig, CafeItem } from "@/lib/game/cafe";

// Café Kanel's counter. Bosse's lessons happen here: items on the menu board,
// orders that land on your tray, and the odd mix-up for you to fix.

const articles: Record<string, "en" | "ett" | null> = { kaffe: "en", te: "ett", kanelbulle: "en", mjoelk: null, vatten: null };

// "en kaffe", "ett te", but plain "mjölk" and "vatten".
function withArticle(item: CafeItem) {
  const article = articles[item.slug];
  return article ? `${article} ${item.name}` : item.name;
}

export const cafe: CafeConfig = {
  menu: [
    { slug: "kaffe", name: "kaffe", en: "coffee", price: 25, icon: "coffee" },
    { slug: "te", name: "te", en: "tea", price: 20, icon: "tea" },
    { slug: "kanelbulle", name: "kanelbulle", en: "cinnamon bun", price: 30, icon: "bun" },
    { slug: "mjoelk", name: "mjölk", en: "milk", price: 5, icon: "milk" },
    { slug: "vatten", name: "vatten", en: "water", price: 0, icon: "water" },
  ],
  orderSlugs: ["jag-skulle-vilja", "med-mjoelk", "och-en-kanelbulle", "vill-ha", "cafe-order-drink", "cafe-order-food", "cafe-ask-bill"],
  later: ["har", "gillar", "vill-ha"],
  orderVariants: {
    "jag-skulle-vilja": [
      { t: "Jag skulle vilja ha en kaffe.", en: "I would like a coffee." },
      { t: "Jag skulle vilja ha ett te.", en: "I would like a tea." },
      { t: "Jag skulle vilja ha en kanelbulle.", en: "I would like a cinnamon bun." },
      { t: "Jag skulle vilja ha vatten.", en: "I would like water." },
    ],
    "vill-ha": [
      { t: "Jag vill ha kaffe.", en: "I want coffee." },
      { t: "Jag vill ha te.", en: "I want tea." },
      { t: "Jag vill ha en kanelbulle.", en: "I want a cinnamon bun." },
    ],
    "med-mjoelk": [
      { t: "En kaffe med mjölk.", en: "A coffee with milk." },
      { t: "Ett te med mjölk.", en: "A tea with milk." },
    ],
    "och-en-kanelbulle": [{ t: "Och en kanelbulle, tack.", en: "And a cinnamon bun, please." }],
    "cafe-order-drink": [
      { t: "Jag skulle vilja ha en kaffe med mjölk, tack.", en: "Order a coffee with milk.", accept: ["^(jag skulle vilja ha|jag vill ha|kan jag få) .*kaffe.*mjölk"] },
      { t: "Jag skulle vilja ha ett te, tack.", en: "Order a tea.", accept: ["^(jag skulle vilja ha|jag vill ha|kan jag få) (ett )?te\\b"] },
      { t: "Jag skulle vilja ha vatten, tack.", en: "Order some water.", accept: ["^(jag skulle vilja ha|jag vill ha|kan jag få) (ett glas )?vatten\\b"] },
    ],
    "cafe-order-food": [{ t: "Och en kanelbulle, tack.", en: "Add a cinnamon bun.", accept: ["\\b(en )?kanelbulle\\b"] }],
    "cafe-ask-bill": [{ t: "Kan jag få notan, tack?", en: "Ask for the bill.", accept: ["^(kan jag få notan|notan tack)\\b"] }],
  },
  trayOrders: [
    { t: "En kaffe och en kanelbulle, tack.", en: "A coffee and a cinnamon bun, please.", items: ["kaffe", "kanelbulle"] },
    { t: "Ett te med mjölk, tack.", en: "A tea with milk, please.", items: ["te", "mjoelk"] },
    { t: "Jag skulle vilja ha vatten och en kanelbulle.", en: "I would like water and a cinnamon bun.", items: ["vatten", "kanelbulle"] },
    { t: "Jag vill ha ett te och en kaffe.", en: "I want a tea and a coffee.", items: ["te", "kaffe"] },
    { t: "En kaffe med mjölk, tack.", en: "A coffee with milk, please.", items: ["kaffe", "mjoelk"] },
    { t: "Bara ett glas vatten, tack.", en: "Just a glass of water, please.", items: ["vatten"] },
    { t: "Två kanelbullar och ett te.", en: "Two cinnamon buns and a tea.", items: ["kanelbulle", "te"] },
  ],
  orderExchange: {
    situation: "You're ordering at the counter of Café Kanel.",
    speaker: "Bosse",
    cue: { t: "Hej! Vad vill du ha?", en: "Hi! What would you like?" },
    reaction: { t: "Varsågod! Det blir gott.", en: "Here you go! It'll taste good." },
  },
  billExchange: {
    situation: "You've finished your fika at Café Kanel.",
    speaker: "Bosse",
    cue: { t: "Var det gott?", en: "Did you enjoy it?" },
    reaction: { t: "Det blir femtiofem kronor, tack.", en: "That'll be fifty-five kronor, thanks." },
  },
  billSlug: "cafe-ask-bill",
  lines: {
    sorry: { t: "Oj, förlåt! Varsågod.", en: "Oops, sorry! Here you go." },
    served: { t: "Varsågod!", en: "Here you go!" },
    whatIsThis: { t: "Vad är det här?", en: "What is this?" },
    tapWhatYouHear: { t: "Peka på det Bosse säger!", en: "Point at what Bosse says!" },
    howToOrder: { t: "Så här beställer man:", en: "This is how you order:" },
    orderThis: { t: "Beställ det här!", en: "Order this!" },
    menu: { t: "Meny", en: "Menu" },
    oops: { t: "Bosse gör fel!", en: "Bosse gets it wrong!" },
  },
  withArticle,
  introduce(item) {
    const t = `Det här är ${withArticle(item)}!`;
    return { t: t.charAt(0).toUpperCase() + t.slice(1), en: `This is ${articles[item.slug] ? "a " : ""}${item.en}!` };
  },
  price(item) {
    return item.price === 0 ? { t: "gratis", en: "free" } : { t: `${item.price} kr`, en: `${item.price} kronor` };
  },
  serve(item) {
    return { t: `Varsågod, ${withArticle(item)}!`, en: `Here you go, ${articles[item.slug] ? "a " : ""}${item.en}!` };
  },
  checkOrder(item) {
    return { t: `Hmm, du beställde väl ${withArticle(item)}?`, en: `Hmm, you ordered ${item.en}, didn't you?` };
  },
  fixOptions(want, got, decoy) {
    return [
      { t: `Nej, jag vill ha ${want.name}, inte ${got.name}.`, en: `No, I want ${want.en}, not ${got.en}.` },
      { t: "Tack, perfekt!", en: "Thanks, perfect!" },
      { t: `Nej, jag vill ha ${decoy.name}, inte ${got.name}.`, en: `No, I want ${decoy.en}, not ${got.en}.` },
    ];
  },
};
