import { namedHour, numberIn, type ClockConfig, type Time } from "@/lib/game/clock";
import { spoken } from "@/lib/game/line";
import { normalizeText } from "@/lib/learning/text";

// Jonas's workshop. German names a time after the coming hour: halb vier is
// half past THREE, Viertel vor vier is a quarter to four. "Ein Uhr" drops the
// s that "halb eins" keeps.

const words = ["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
const english = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function say(time: Time) {
  const named = namedHour(time);
  const word = words[named - 1];
  const en = english[time.h - 1];
  switch (time.m) {
    case 0:
      return { t: `${named === 1 ? "ein" : word} Uhr`, en: `${en} o'clock` };
    case 30:
      return { t: `halb ${word}`, en: `half past ${en}` };
    case 15:
      return { t: `Viertel nach ${word}`, en: `quarter past ${en}` };
    default:
      return { t: `Viertel vor ${word}`, en: `quarter to ${english[named - 1]}` };
  }
}

// Number words to values, with "ein" for "ein Uhr".
const values: Record<string, number> = Object.fromEntries([...words.map((w, i) => [w, i + 1]), ["ein", 1]]);

const days = [
  { slug: "montag", name: { t: "Montag", en: "Monday" } },
  { slug: "dienstag", name: { t: "Dienstag", en: "Tuesday" } },
  { slug: "mittwoch", name: { t: "Mittwoch", en: "Wednesday" } },
  { slug: "donnerstag", name: { t: "Donnerstag", en: "Thursday" } },
  { slug: "freitag", name: { t: "Freitag", en: "Friday" } },
];

export const clock: ClockConfig = {
  host: "jonas",
  numbers: ["eins", "zwei", "drei", "vier", "fuenf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwoelf"],
  forms: { oclock: "es-ist-uhr", half: "halb", past: "viertel-nach", to: "viertel-vor" },
  say,
  parse(text, code) {
    const said = normalizeText(text, code).split(" ").filter(Boolean);
    if (said.some((w) => /\d/.test(w))) return "digits";
    const at = (word: string) => said.indexOf(word);
    const after = (i: number) => (i >= 0 ? numberIn(said.slice(i + 1, i + 2), values, code) : null);
    const before = (i: number) => (i > 0 ? numberIn(said.slice(i - 1, i), values, code) : null);
    const minus = (n: number) => ((n + 10) % 12) + 1;
    if (at("halb") >= 0) {
      const n = after(at("halb"));
      return n ? { h: minus(n), m: 30 } : null;
    }
    if (at("viertel") >= 0) {
      const i = at("viertel");
      const word = said[i + 1];
      const n = numberIn(said.slice(i + 2, i + 3), values, code);
      if (!n) return null;
      if (word === "nach") return { h: n, m: 15 };
      if (word === "vor") return { h: minus(n), m: 45 };
      return null;
    }
    if (at("uhr") >= 0) {
      const n = before(at("uhr"));
      return n ? { h: n, m: 0 } : null;
    }
    return null;
  },
  setRequest(time, variant) {
    const s = say(time);
    return variant === 0
      ? { t: `Meine Uhr steht. Stell sie bitte auf ${s.t}.`, en: `My clock has stopped. Please set it to ${s.en}.` }
      : { t: `Kannst du die Uhr auf ${s.t} stellen?`, en: `Can you set the clock to ${s.en}?` };
  },
  // Two clips, so any wrong time can be answered: what it says, what they need.
  wrongTime(want, got) {
    return spoken([`Nein, das ist ${say(got).t}!`, `Ich brauche ${say(want).t}.`], `No, that's ${say(got).en}! I need ${say(want).en}.`);
  },
  ask: { t: "Wie spät ist es eigentlich?", en: "What time is it, actually?" },
  told(time) {
    return { t: `${capital(say(time).t)}? Oh, schon so spät!`, en: `${capital(say(time).en)}? Oh, it's late already!` };
  },
  toldWrong: { t: "Wirklich? Schau noch einmal auf die Uhr!", en: "Really? Look at the clock again!" },
  words: { t: "Sag es mit Wörtern, bitte!", en: "Say it in words, please!" },
  appointments: {
    days,
    ask(day, hour) {
      const time = say({ h: hour, m: 0 });
      return { t: `Wann ist die Uhr fertig? Passt es dir am ${day.name.t} um ${time.t}?`, en: `When will the clock be ready? Does ${day.name.en} at ${time.en} suit you?` };
    },
    yes: { concept: "das-passt", line: { t: "Das passt gut.", en: "That works well." } },
    no: { concept: "das-geht-nicht", line: { t: "Das geht leider nicht.", en: "Unfortunately that doesn't work." } },
    wrong: { t: "Schau mal in den Kalender!", en: "Have a look in the calendar!" },
  },
  lines: {
    invite: { t: "Kann ich dir helfen?", en: "Can I help you?" },
    notYet: { t: "Lern zuerst die Uhrzeit!", en: "First learn to tell the time!" },
    intro: [
      { t: "Tick, tack! Gut, dass du kommst!", en: "Tick, tock! Good that you've come!" },
      { t: "Heute bringen alle ihre Uhren. Hör gut zu, welche Zeit sie brauchen.", en: "Everyone's bringing their clocks today. Listen carefully to what time they need." },
      { t: "Dreh die Zeiger und dann: Fertig!", en: "Turn the hands, and then: done!" },
    ],
    title: { t: "Die Uhrmacherei", en: "The clockmaker's workshop" },
    howTo: { t: "Dreh den kleinen und den großen Zeiger.", en: "Turn the small hand and the big hand." },
    hour: { t: "Stunde", en: "hour" },
    minute: { t: "Minute", en: "minute" },
    ready: { t: "Fertig!", en: "Done!" },
    calendar: { t: "Kalender", en: "Calendar" },
    busy: { t: "besetzt", en: "busy" },
    thanks: [
      { t: "Danke! Sie läuft wieder!", en: "Thanks! It's running again!" },
      { t: "Super, vielen Dank!", en: "Great, thanks a lot!" },
      { t: "Perfekt! Tick, tack!", en: "Perfect! Tick, tock!" },
    ],
    repeat: { t: "Wie bitte?", en: "Pardon?" },
    late: { t: "Oh, es ist schon Feierabend!", en: "Oh, it's already closing time!" },
    done: [
      { t: "Alle Uhren laufen! Du bist ein echter Uhrmacher!", en: "All the clocks are running! You're a real clockmaker!" },
      { t: "Gut gemacht! Danke für die Hilfe.", en: "Well done! Thanks for the help." },
      { t: "Puh, die Zeit vergeht so schnell! Danke trotzdem.", en: "Phew, time flies so fast! Thanks anyway." },
    ],
    harder: { t: "Morgen kommen noch mehr Uhren!", en: "Tomorrow even more clocks are coming!" },
    again: { t: "Noch einmal!", en: "Once more!" },
    back: { t: "Zurück ins Dorf", en: "Back to the village" },
    clock: { t: "Feierabend", en: "closing time" },
  },
};
