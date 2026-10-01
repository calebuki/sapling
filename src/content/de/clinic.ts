import type { ClinicConfig, ClinicPart, HerbColor, Spoons } from "@/lib/game/clinic";

// Aylin's surgery. Patients say what hurts ("Mein Hals tut weh."), she brews a
// herbal remedy from a recipe of coloured herbs, and from the third rung you
// also answer how patients feel and tell them what to do ("Du musst viel
// trinken."), all from her two units.

type Gender = "m" | "f" | "n";
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const parts: Array<ClinicPart & { gender: Gender; noun: string; pain?: { t: string; en: string } }> = [
  { slug: "der-kopf", part: "head", name: { t: "der Kopf", en: "head" }, gender: "m", noun: "Kopf", pain: { t: "Kopfschmerzen", en: "a headache" } },
  { slug: "das-auge", part: "eye", name: { t: "das Auge", en: "eye" }, gender: "n", noun: "Auge" },
  { slug: "das-ohr", part: "ear", name: { t: "das Ohr", en: "ear" }, gender: "n", noun: "Ohr" },
  { slug: "die-nase", part: "nose", name: { t: "die Nase", en: "nose" }, gender: "f", noun: "Nase" },
  { slug: "der-zahn", part: "tooth", name: { t: "der Zahn", en: "tooth" }, gender: "m", noun: "Zahn", pain: { t: "Zahnschmerzen", en: "toothache" } },
  { slug: "der-hals", part: "throat", name: { t: "der Hals", en: "throat" }, gender: "m", noun: "Hals", pain: { t: "Halsschmerzen", en: "a sore throat" } },
  { slug: "der-arm", part: "arm", name: { t: "der Arm", en: "arm" }, gender: "m", noun: "Arm" },
  { slug: "die-hand", part: "hand", name: { t: "die Hand", en: "hand" }, gender: "f", noun: "Hand" },
  { slug: "der-bauch", part: "belly", name: { t: "der Bauch", en: "stomach" }, gender: "m", noun: "Bauch", pain: { t: "Bauchschmerzen", en: "a stomach ache" } },
  { slug: "das-bein", part: "leg", name: { t: "das Bein", en: "leg" }, gender: "n", noun: "Bein" },
  { slug: "der-fuss", part: "foot", name: { t: "der Fuß", en: "foot" }, gender: "m", noun: "Fuß" },
];

const partOf = (p: ClinicPart) => parts.find((x) => x.slug === p.slug)!;
const my = (p: ClinicPart) => `${partOf(p).gender === "f" ? "meine" : "mein"} ${partOf(p).noun}`;

// Plural herbs after a number take the -e ending: zwei Löffel rote Kräuter.
const herb: Record<HerbColor, { t: string; en: string }> = {
  red: { t: "rote", en: "red" },
  yellow: { t: "gelbe", en: "yellow" },
  green: { t: "grüne", en: "green" },
  blue: { t: "blaue", en: "blue" },
};
const count: Record<Spoons, { t: string; en: string }> = {
  1: { t: "ein Löffel", en: "one spoon" },
  2: { t: "zwei Löffel", en: "two spoons" },
  3: { t: "drei Löffel", en: "three spoons" },
};

export const clinic: ClinicConfig = {
  host: "aylin",
  parts,
  colors: [
    { slug: "rot", color: "red", word: { t: "rot", en: "red" } },
    { slug: "gelb", color: "yellow", word: { t: "gelb", en: "yellow" } },
    { slug: "gruen", color: "green", word: { t: "grün", en: "green" } },
    { slug: "blau", color: "blue", word: { t: "blau", en: "blue" } },
  ],
  numbers: { 1: "eins", 2: "zwei", 3: "drei" },
  heat: { hot: "heiss", cold: "kalt" },
  sugar: "zucker",
  feelings: [
    { concept: "nervoes", line: { t: "Ich bin so nervös.", en: "I'm so nervous." }, reply: "worry" },
    { concept: "angst-haben", line: { t: "Ich habe Angst.", en: "I'm afraid." }, reply: "worry" },
    { concept: "gestresst", line: { t: "Ich bin total gestresst.", en: "I'm totally stressed." }, reply: "worry" },
    { concept: "traurig", line: { t: "Ich bin traurig. Mein Hund ist krank.", en: "I'm sad. My dog is ill." }, reply: "sorry" },
    { concept: "einsam", line: { t: "Ich bin oft einsam.", en: "I'm often lonely." }, reply: "sorry" },
    { concept: "gluecklich", line: { t: "Ich bin heute so glücklich!", en: "I'm so happy today!" }, reply: "glad" },
    { concept: "mir-geht-es-besser", line: { t: "Mir geht es schon besser!", en: "I'm already feeling better!" }, reply: "glad" },
  ],
  replies: {
    worry: { concept: "keine-sorge", line: { t: "Keine Sorge!", en: "Don't worry!" } },
    sorry: { concept: "das-tut-mir-leid", line: { t: "Das tut mir leid.", en: "I'm sorry to hear that." } },
    glad: { concept: "wie-schoen", line: { t: "Wie schön!", en: "How lovely!" } },
  },
  advice: {
    bed: { concepts: ["im-bett-bleiben"], say: { t: "Du musst im Bett bleiben.", en: "You have to stay in bed." }, accept: ["\\b(du (musst|sollst) (heute )?im bett bleiben|bleib (heute )?im bett)\\b"] },
    drink: { concepts: ["viel", "trinken"], say: { t: "Du musst viel trinken.", en: "You have to drink a lot." }, accept: ["\\b(du (musst|sollst) viel (wasser |tee )?trinken|trink viel)\\b"] },
    rest: { concepts: ["sich-ausruhen"], say: { t: "Du musst dich ausruhen.", en: "You have to rest." }, accept: ["\\b(du (musst|sollst) dich ausruhen|ruh dich aus)\\b"] },
  },
  adviceFrame: { concept: "du-musst", pattern: String.raw`\bdu (musst|sollst)\b` },
  complaint(part, variant) {
    const { pain } = partOf(part);
    // "Ich habe Kopfschmerzen" where German has a word for that pain.
    if (variant === 1 && pain) return { t: `Ich habe ${pain.t}.`, en: `I have ${pain.en}.` };
    return variant === 1
      ? { t: `Au! ${capital(my(part))} tut so weh.`, en: `Ouch! My ${part.name.en} hurts so much.` }
      : { t: `${capital(my(part))} tut weh.`, en: `My ${part.name.en} hurts.` };
  },
  wrongPart(want, got) {
    return { t: `Nein, das ist ${my(got)}! ${capital(my(want))} tut weh.`, en: `No, that's my ${got.name.en}! My ${want.name.en} hurts.` };
  },
  recipe(recipe) {
    const herbs = recipe.herbs.map((h) => ({ t: `${count[h.spoons].t} ${herb[h.color].t} Kräuter`, en: `${count[h.spoons].en} of ${herb[h.color].en} herbs` }));
    const water = recipe.water === "hot" ? { t: "heißes Wasser", en: "hot water" } : { t: "kaltes Wasser", en: "cold water" };
    const items = [...herbs, water];
    const join = (key: "t" | "en", and: string) => `${items.slice(0, -1).map((i) => i[key]).join(", ")} ${and} ${items[items.length - 1][key]}`;
    const sugar = recipe.sugar ? { t: ", mit Zucker", en: ", with sugar" } : { t: "", en: "" };
    return { t: `Für den Trank: ${join("t", "und")}${sugar.t}.`, en: `For the potion: ${join("en", "and")}${sugar.en}.` };
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Wörter über den Körper!", en: "First learn a few words about the body!" },
    intro: [
      { t: "Oh, gut, dass du da bist! Heute sind so viele Leute krank.", en: "Oh, good that you're here! So many people are ill today." },
      { t: "Hör gut zu: Wo tut es weh? Zeig es mir!", en: "Listen carefully: where does it hurt? Show me!" },
      { t: "Dann machen wir zusammen einen Trank aus Kräutern.", en: "Then we'll make a potion out of herbs together." },
    ],
    title: { t: "Die Sprechstunde", en: "Surgery hours" },
    howTo: { t: "Klick auf die Stelle, wo es weh tut.", en: "Click the place where it hurts." },
    where: { t: "Wo tut es weh?", en: "Where does it hurt?" },
    brew: { t: "Mach den Trank im Kessel!", en: "Make the potion in the cauldron!" },
    brewWrong: { t: "Hmm, das stimmt nicht. Hör noch einmal zu!", en: "Hmm, that's not right. Listen again!" },
    brewRight: { t: "Perfekt! Der Trank ist fertig.", en: "Perfect! The potion is ready." },
    drink: { t: "Hier, trink das!", en: "Here, drink this!" },
    adviceAsk: { t: "Was soll ich jetzt machen?", en: "What should I do now?" },
    adviceTell: { t: "Sag es mit „Du musst …“!", en: "Say it with “Du musst …”!" },
    adviceWrong: { t: "Wie bitte? Was soll ich machen?", en: "Pardon? What should I do?" },
    replyAsk: { t: "Was sagst du?", en: "What do you say?" },
    replyWrong: { t: "Hmm, das passt nicht so gut.", en: "Hmm, that doesn't quite fit." },
    thanks: [
      { t: "Danke, Frau Doktor!", en: "Thank you, doctor!" },
      { t: "Vielen Dank! Tschüss!", en: "Thanks a lot! Bye!" },
      { t: "Danke, das hilft!", en: "Thanks, that helps!" },
    ],
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    late: { t: "Oh, die Sprechstunde ist schon vorbei!", en: "Oh, surgery hours are already over!" },
    done: [
      { t: "Alle sind gesund! Du bist ein toller Arzt!", en: "Everyone is well! You're a great doctor!" },
      { t: "Gut gemacht! Danke für die Hilfe.", en: "Well done! Thanks for the help." },
      { t: "Puh, was für ein Tag! Danke trotzdem.", en: "Phew, what a day! Thanks anyway." },
    ],
    harder: { t: "Morgen kommen noch mehr Patienten!", en: "Tomorrow even more patients are coming!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
    clock: { t: "Sprechstunde", en: "surgery hours" },
    pot: { t: "Im Kessel", en: "In the cauldron" },
    empty: { t: "Kessel leeren", en: "Empty the cauldron" },
    ready: { t: "Fertig!", en: "Done!" },
    hot: { t: "heiß", en: "hot" },
    cold: { t: "kalt", en: "cold" },
    sugar: { t: "Zucker", en: "sugar" },
  },
};
