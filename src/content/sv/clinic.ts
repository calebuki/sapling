import type { ClinicConfig, ClinicPart, HerbColor, Spoons } from "@/lib/game/clinic";

// Karin's surgery on Lilla Ö: "Jag har ont i halsen", a herbal brew from a
// recipe of coloured herbs, how patients feel, and "Du borde vila."

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const parts: ClinicPart[] = [
  { slug: "huvudet", part: "head", name: { t: "huvudet", en: "head" } },
  { slug: "oegat", part: "eye", name: { t: "ögat", en: "eye" } },
  { slug: "oerat", part: "ear", name: { t: "örat", en: "ear" } },
  { slug: "tanden", part: "tooth", name: { t: "tanden", en: "tooth" } },
  { slug: "halsen", part: "throat", name: { t: "halsen", en: "throat" } },
  { slug: "armen", part: "arm", name: { t: "armen", en: "arm" } },
  { slug: "handen", part: "hand", name: { t: "handen", en: "hand" } },
  { slug: "magen", part: "belly", name: { t: "magen", en: "stomach" } },
  { slug: "benet", part: "leg", name: { t: "benet", en: "leg" } },
  { slug: "foten", part: "foot", name: { t: "foten", en: "foot" } },
];

// Plural after a number: två skedar röda örter.
const herb: Record<HerbColor, { t: string; en: string }> = {
  red: { t: "röda", en: "red" },
  yellow: { t: "gula", en: "yellow" },
  green: { t: "gröna", en: "green" },
  blue: { t: "blå", en: "blue" },
};
const count: Record<Spoons, { t: string; en: string }> = {
  1: { t: "en sked", en: "one spoon" },
  2: { t: "två skedar", en: "two spoons" },
  3: { t: "tre skedar", en: "three spoons" },
};

export const clinic: ClinicConfig = {
  host: "karin",
  parts,
  colors: [
    { slug: "roed", color: "red", word: { t: "röd", en: "red" } },
    { slug: "gul", color: "yellow", word: { t: "gul", en: "yellow" } },
    { slug: "groen", color: "green", word: { t: "grön", en: "green" } },
    { slug: "blaa", color: "blue", word: { t: "blå", en: "blue" } },
  ],
  numbers: { 1: "ett", 2: "tvaa", 3: "tre" },
  heat: { hot: "varm", cold: "kall" },
  sugar: "socker",
  feelings: [
    { concept: "nervoes", line: { t: "Jag är så nervös.", en: "I'm so nervous." }, reply: "worry" },
    { concept: "ledsen", line: { t: "Jag är ledsen. Min hund är sjuk.", en: "I'm sad. My dog is ill." }, reply: "sorry" },
    { concept: "trott", line: { t: "Jag är så trött.", en: "I'm so tired." }, reply: "sorry" },
    { concept: "glad", line: { t: "Jag är så glad i dag!", en: "I'm so happy today!" }, reply: "glad" },
    { concept: "det-blir-baettre", line: { t: "Det blir bättre!", en: "It's getting better!" }, reply: "glad" },
  ],
  replies: {
    worry: { concept: "oroa-dig-inte", line: { t: "Oroa dig inte!", en: "Don't worry!" } },
    sorry: { concept: "vad-synd", line: { t: "Vad synd!", en: "What a shame!" } },
    glad: { concept: "vad-roligt", line: { t: "Vad roligt!", en: "How lovely!" } },
  },
  advice: {
    drink: { concepts: ["mycket", "vatten"], say: { t: "Du borde dricka mycket vatten.", en: "You should drink lots of water." }, accept: [String.raw`\b(du (borde|måste) dricka mycket( vatten)?|drick mycket( vatten)?)\b`] },
    rest: { concepts: ["vila"], say: { t: "Du borde vila.", en: "You should rest." }, accept: [String.raw`\b(du (borde|måste) vila|vila)\b`] },
  },
  adviceFrame: { concept: "du-borde", pattern: String.raw`\bdu (borde|måste)\b` },
  complaint(part, variant) {
    return variant === 1
      ? { t: `Aj! ${capital(part.name.t)} gör ont.`, en: `Ouch! My ${part.name.en} hurts.` }
      : { t: `Jag har ont i ${part.name.t}.`, en: `My ${part.name.en} hurts.` };
  },
  wrongPart(want, got) {
    return { t: `Nej, det där är ${got.name.t}! Jag har ont i ${want.name.t}.`, en: `No, that's my ${got.name.en}! My ${want.name.en} hurts.` };
  },
  recipe(recipe) {
    const herbs = recipe.herbs.map((h) => ({ t: `${count[h.spoons].t} ${herb[h.color].t} örter`, en: `${count[h.spoons].en} of ${herb[h.color].en} herbs` }));
    const water = recipe.water === "hot" ? { t: "varmt vatten", en: "hot water" } : { t: "kallt vatten", en: "cold water" };
    const items = [...herbs, water];
    const join = (key: "t" | "en", and: string) => `${items.slice(0, -1).map((i) => i[key]).join(", ")} ${and} ${items[items.length - 1][key]}`;
    const sugar = recipe.sugar ? { t: ", med socker", en: ", with sugar" } : { t: "", en: "" };
    return { t: `Till drycken: ${join("t", "och")}${sugar.t}.`, en: `For the potion: ${join("en", "and")}${sugar.en}.` };
  },
  lines: {
    invite: { t: "Kan jag hjälpa till?", en: "Can I help?" },
    notYet: { t: "Lär dig några ord om kroppen först!", en: "Learn a few words about the body first!" },
    intro: [
      { t: "Vad bra att du kom! Så många är sjuka i dag.", en: "Good that you came! So many people are ill today." },
      { t: "Lyssna noga: var gör det ont? Visa mig!", en: "Listen carefully: where does it hurt? Show me!" },
      { t: "Sedan gör vi en dryck av örter tillsammans.", en: "Then we'll make a potion out of herbs together." },
    ],
    title: { t: "Mottagningen", en: "The surgery" },
    howTo: { t: "Klicka där det gör ont.", en: "Click where it hurts." },
    where: { t: "Var gör det ont?", en: "Where does it hurt?" },
    brew: { t: "Gör drycken i kitteln!", en: "Make the potion in the cauldron!" },
    brewWrong: { t: "Hmm, det stämmer inte. Lyssna igen!", en: "Hmm, that's not right. Listen again!" },
    brewRight: { t: "Perfekt! Drycken är klar.", en: "Perfect! The potion is ready." },
    drink: { t: "Här, drick det här!", en: "Here, drink this!" },
    adviceAsk: { t: "Vad ska jag göra nu?", en: "What should I do now?" },
    adviceTell: { t: "Säg det med ”Du borde …”!", en: "Say it with “Du borde …”!" },
    adviceWrong: { t: "Förlåt? Vad ska jag göra?", en: "Sorry? What should I do?" },
    replyAsk: { t: "Vad säger du?", en: "What do you say?" },
    replyWrong: { t: "Hmm, det passar inte så bra.", en: "Hmm, that doesn't quite fit." },
    thanks: [
      { t: "Tack, syster!", en: "Thank you, nurse!" },
      { t: "Tack så mycket! Hej då!", en: "Thanks a lot! Bye!" },
      { t: "Tack, det hjälper!", en: "Thanks, that helps!" },
    ],
    repeat: { t: "Förlåt?", en: "Pardon?" },
    late: { t: "Åh, mottagningen är redan stängd!", en: "Oh, the surgery is already closed!" },
    done: [
      { t: "Alla är friska! Du är en toppenläkare!", en: "Everyone is well! You're a great doctor!" },
      { t: "Bra jobbat! Tack för hjälpen.", en: "Good job! Thanks for the help." },
      { t: "Puh, vilken dag! Tack ändå.", en: "Phew, what a day! Thanks anyway." },
    ],
    harder: { t: "I morgon kommer ännu fler patienter!", en: "Tomorrow even more patients are coming!" },
    again: { t: "En gång till!", en: "Once more!" },
    back: { t: "Tillbaka till byn", en: "Back to the village" },
    clock: { t: "Mottagningen", en: "surgery hours" },
    pot: { t: "I kitteln", en: "In the cauldron" },
    empty: { t: "Töm kitteln", en: "Empty the cauldron" },
    ready: { t: "Klar!", en: "Done!" },
    hot: { t: "varm", en: "hot" },
    cold: { t: "kall", en: "cold" },
    sugar: { t: "socker", en: "sugar" },
  },
};
