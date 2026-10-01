import { spoken } from "@/lib/game/line";
import type { Destination, Landmark, StationConfig, TicketKind } from "@/lib/game/station";
import { normalizeText } from "@/lib/learning/text";

// Lena's station. Tickets go "nach" a town; asking the way goes "zum" or
// "zur" a place, and the directions turn "an der" or "am" a landmark (the
// dative again): an der Kirche links, am Hotel rechts.

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const destinations: Destination[] = [
  { slug: "freiburg", name: { t: "Freiburg", en: "Freiburg" }, platform: 1 },
  { slug: "hinterzarten", name: { t: "Hinterzarten", en: "Hinterzarten" }, platform: 2 },
  { slug: "titisee", name: { t: "Titisee", en: "Titisee" }, platform: 3 },
  { slug: "konstanz", name: { t: "Konstanz", en: "Konstanz" }, platform: 4 },
];

// `to`: "zur Kirche"; `at`: "an der Kirche"; `name`: "die Kirche".
const landmarks: Array<Landmark & { to: string; at: string }> = [
  { slug: "die-apotheke", kind: "pharmacy", name: { t: "die Apotheke", en: "the pharmacy" }, node: { c: 0, r: 1 }, corner: "sw", to: "zur Apotheke", at: "an der Apotheke" },
  { slug: "die-post", kind: "post", name: { t: "die Post", en: "the post office" }, node: { c: 2, r: 1 }, corner: "se", to: "zur Post", at: "an der Post" },
  { slug: "die-kirche", kind: "church", name: { t: "die Kirche", en: "the church" }, node: { c: 0, r: 2 }, corner: "nw", to: "zur Kirche", at: "an der Kirche" },
  { slug: "der-brunnen", kind: "fountain", name: { t: "der Brunnen", en: "the fountain" }, node: { c: 1, r: 2 }, corner: "ne", to: "zum Brunnen", at: "am Brunnen" },
  { slug: "das-hotel", kind: "hotel", name: { t: "das Hotel", en: "the hotel" }, node: { c: 2, r: 2 }, corner: "ne", to: "zum Hotel", at: "am Hotel" },
  { slug: "das-museum", kind: "museum", name: { t: "das Museum", en: "the museum" }, node: { c: 0, r: 3 }, corner: "ne", to: "zum Museum", at: "am Museum" },
  { slug: "der-park", kind: "park", name: { t: "der Park", en: "the park" }, node: { c: 1, r: 3 }, corner: "nw", to: "zum Park", at: "am Park" },
  { slug: "die-schule", kind: "school", name: { t: "die Schule", en: "the school" }, node: { c: 2, r: 3 }, corner: "nw", to: "zur Schule", at: "an der Schule" },
  { slug: "das-restaurant", kind: "restaurant", name: { t: "das Restaurant", en: "the restaurant" }, node: { c: 2, r: 0 }, corner: "se", to: "zum Restaurant", at: "am Restaurant" },
  { slug: "die-bank", kind: "bank", name: { t: "die Bank", en: "the bank" }, node: { c: 0, r: 0 }, corner: "nw", to: "zur Bank", at: "an der Bank" },
];

const landmarkOf = (l: Landmark) => landmarks.find((x) => x.slug === l.slug)!;
const way = { left: { t: "links", en: "left" }, right: { t: "rechts", en: "right" } };
const ordinal = [
  { t: "", en: "" },
  { t: "erste", en: "first" },
  { t: "zweite", en: "second" },
  { t: "dritte", en: "third" },
];

const words = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs"];
const english = ["zero", "one", "two", "three", "four", "five", "six"];
const fold = (w: string) => w.replace(/ä|ae/g, "a").replace(/ö|oe/g, "o").replace(/ü|ue/g, "u").replace(/ß/g, "ss");
const values: Record<string, number> = Object.fromEntries([...words.map((w, i) => [fold(w), i] as const), ["ein", 1] as const]);

const kindLine = (kind: TicketKind) => (kind === "single" ? { t: "Einfach, bitte.", en: "One way, please." } : { t: "Hin und zurück, bitte.", en: "Return, please." });
const ask = (d: Destination) => ({ t: `Eine Fahrkarte nach ${d.name.t}, bitte.`, en: `A ticket to ${d.name.en}, please.` });

export const station: StationConfig = {
  host: "lena",
  destinations,
  landmarks,
  // Traffic lights at the middle crossing.
  lights: [{ c: 1, r: 1 }],
  numbers: { 1: "eins", 2: "zwei", 3: "drei", 4: "vier" },
  concepts: {
    ticket: "die-fahrkarte",
    single: "einfach",
    return: "hin-und-zurueck",
    platform: "das-gleis",
    left: "links",
    right: "rechts",
    straight: "geradeaus",
    light: "die-ampel",
    first: "erste",
    second: "zweite",
    third: "dritte",
    howDoIGet: "wie-komme-ich",
  },
  askTicket: ask,
  kindAnswer: kindLine,
  wrongTicket(d, kind) {
    const a = ask(d);
    const k = kindLine(kind);
    return spoken(["Nein, das stimmt nicht.", a.t, k.t], `No, that's not right. ${a.en} ${k.en}`);
  },
  platform(n) {
    return { t: `Gleis ${words[n]}.`, en: `Platform ${english[n]}.` };
  },
  parsePlatform(text, code) {
    const said = normalizeText(text, code).split(" ").filter(Boolean);
    if (said.some((w) => /\d/.test(w))) return "digits";
    return said.map((w) => values[fold(w)]).find((v) => v !== undefined) ?? null;
  },
  askWay(l) {
    const x = landmarkOf(l);
    return { t: `Entschuldigung, wie komme ich ${x.to}?`, en: `Excuse me, how do I get to ${l.name.en}?` };
  },
  instruction(s) {
    if (s.kind === "straight") return { t: "Geh geradeaus.", en: "Go straight ahead." };
    if (s.kind === "arrive") {
      const name = s.landmark.name;
      return { t: `${capital(name.t)} ist ${way[s.side].t}.`, en: `${capital(name.en)} is on the ${way[s.side].en}.` };
    }
    if (s.ref.type === "landmark") {
      const x = landmarkOf(s.ref.landmark);
      return { t: `${capital(x.at)} ${way[s.way].t}.`, en: `${way[s.way].en === "left" ? "Left" : "Right"} at ${s.ref.landmark.name.en}.` };
    }
    if (s.ref.type === "light") return { t: `An der Ampel ${way[s.way].t}.`, en: `${s.way === "left" ? "Left" : "Right"} at the traffic lights.` };
    return { t: `Dann die ${ordinal[s.ref.n].t} Straße ${way[s.way].t}.`, en: `Then the ${ordinal[s.ref.n].en} street on the ${way[s.way].en}.` };
  },
  wrongBuilding(got) {
    return { t: `Nein, das ist ${got.name.t}.`, en: `No, that's ${got.name.en}.` };
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst ein paar Wörter zum Reisen!", en: "First learn a few words for travelling!" },
    intro: [
      { t: "Hallo! Gut, dass du da bist. Heute fahren viele Leute weg!", en: "Hi! Good that you're here. Lots of people are travelling today!" },
      { t: "Verkauf die Fahrkarten und sag, von welchem Gleis der Zug fährt.", en: "Sell the tickets and say which platform the train leaves from." },
      { t: "Schau dafür auf den Fahrplan.", en: "Look at the timetable for that." },
    ],
    townIntro: { t: "Und manche Leute fragen nach dem Weg. Dann trägst du ihren Koffer hin!", en: "And some people ask the way. Then you carry their suitcase there!" },
    title: { t: "Am Bahnhof", en: "At the station" },
    clock: { t: "Der Zug kommt", en: "The train is coming" },
    hello: [
      { t: "Guten Tag!", en: "Hello!" },
      { t: "Hallo!", en: "Hi!" },
      { t: "Guten Morgen!", en: "Good morning!" },
    ],
    whichKind: { t: "Einfach oder hin und zurück?", en: "One way or return?" },
    askPlatform: { t: "Von welchem Gleis fährt der Zug?", en: "Which platform does the train leave from?" },
    platformWrong: { t: "Schau noch mal auf den Fahrplan!", en: "Look at the timetable again!" },
    words: { t: "Sag es mit Wörtern!", en: "Say it in words!" },
    thanks: [
      { t: "Danke! Tschüss!", en: "Thanks! Bye!" },
      { t: "Vielen Dank!", en: "Thanks a lot!" },
      { t: "Super, danke schön!", en: "Great, thank you!" },
    ],
    carry: { t: "Bring bitte den Koffer hin. Hör gut zu!", en: "Please carry the suitcase there. Listen carefully!" },
    lost: { t: "Kein Problem! Fang noch mal am Bahnhof an.", en: "No problem! Start again from the station." },
    arrived: { t: "Danke! Da ist es ja!", en: "Thanks! There it is!" },
    ticket: { t: "Die Fahrkarte", en: "The ticket" },
    print: { t: "Drucken", en: "Print" },
    board: { t: "Der Fahrplan", en: "The timetable" },
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    late: { t: "Oh nein, der Zug ist schon weg!", en: "Oh no, the train has already gone!" },
    done: [
      { t: "Alle sind gut unterwegs! Super gemacht!", en: "Everyone's on their way! Great job!" },
      { t: "Gut gemacht! Fast alle sind im Zug.", en: "Well done! Almost everyone is on the train." },
      { t: "Puh! Morgen klappt es besser.", en: "Phew! It'll go better tomorrow." },
    ],
    harder: { t: "Morgen ist noch mehr los!", en: "Tomorrow it'll be even busier!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
  },
};
