import { namedHour, numberIn, type ClockConfig, type Time } from "@/lib/game/clock";
import { normalizeText } from "@/lib/learning/text";

// Stina keeps the island's clocks. Swedish, like German, names half past
// after the coming hour: halv fyra is half past THREE.

const words = ["ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv"];
const english = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function say(time: Time) {
  const named = namedHour(time);
  const word = words[named - 1];
  const en = english[time.h - 1];
  switch (time.m) {
    case 0:
      return { t: `klockan ${word}`, en: `${en} o'clock` };
    case 30:
      return { t: `halv ${word}`, en: `half past ${en}` };
    case 15:
      return { t: `kvart över ${word}`, en: `quarter past ${en}` };
    default:
      return { t: `kvart i ${word}`, en: `quarter to ${english[named - 1]}` };
  }
}

const values: Record<string, number> = Object.fromEntries([...words.map((w, i) => [w, i + 1]), ["en", 1]]);

const days = [
  { slug: "maandag", name: { t: "måndag", en: "Monday" } },
  { slug: "tisdag", name: { t: "tisdag", en: "Tuesday" } },
  { slug: "onsdag", name: { t: "onsdag", en: "Wednesday" } },
  { slug: "torsdag", name: { t: "torsdag", en: "Thursday" } },
  { slug: "fredag", name: { t: "fredag", en: "Friday" } },
];

export const clock: ClockConfig = {
  host: "stina",
  numbers: ["ett", "tvaa", "tre", "fyra", "fem", "sex", "sju", "aatta", "nio", "tio", "elva", "tolv"],
  forms: { oclock: "klockan-aer", half: "halv", past: "kvart-oever", to: "kvart-i" },
  say,
  parse(text, code) {
    const said = normalizeText(text, code).split(" ").filter(Boolean);
    if (said.some((w) => /\d/.test(w))) return "digits";
    const at = (word: string) => said.indexOf(word);
    const minus = (n: number) => ((n + 10) % 12) + 1;
    const number = (from: number) => numberIn(said.slice(from, from + 1), values, code);
    if (at("halv") >= 0) {
      const n = number(at("halv") + 1);
      return n ? { h: minus(n), m: 30 } : null;
    }
    const kvart = at("kvart");
    if (kvart >= 0) {
      const word = said[kvart + 1];
      const n = number(kvart + 2);
      if (!n) return null;
      if (word === "över" || word === "over") return { h: n, m: 15 };
      if (word === "i") return { h: minus(n), m: 45 };
      return null;
    }
    // "Klockan är tre", "klockan tre", or just "tre".
    const n = numberIn(said.filter((w) => w !== "klockan" && w !== "är" && w !== "ar"), values, code);
    return n ? { h: n, m: 0 } : null;
  },
  setRequest(time, variant) {
    const s = say(time);
    return variant === 0
      ? { t: `Min klocka har stannat. Kan du ställa den på ${s.t}?`, en: `My clock has stopped. Can you set it to ${s.en}?` }
      : { t: `Kan du ställa klockan på ${s.t}?`, en: `Can you set the clock to ${s.en}?` };
  },
  wrongTime(want, got) {
    return { t: `Nej, det är ${say(got).t}! Jag behöver ${say(want).t}.`, en: `No, that's ${say(got).en}! I need ${say(want).en}.` };
  },
  ask: { t: "Vad är klockan egentligen?", en: "What time is it, actually?" },
  told(time) {
    return { t: `${capital(say(time).t)}? Oj, redan så sent!`, en: `${capital(say(time).en)}? Oh, it's late already!` };
  },
  toldWrong: { t: "Verkligen? Titta på klockan igen!", en: "Really? Look at the clock again!" },
  words: { t: "Säg det med ord, tack!", en: "Say it in words, please!" },
  appointments: {
    days,
    ask(day, hour) {
      return { t: `När är klockan klar? Passar det på ${day.name.t} klockan ${words[hour - 1]}?`, en: `When will the clock be ready? Does ${day.name.en} at ${english[hour - 1]} suit you?` };
    },
    yes: { concept: "det-passar-bra", line: { t: "Det passar bra.", en: "That suits me fine." } },
    no: { concept: "jag-kan-inte", line: { t: "Tyvärr, jag kan inte.", en: "Unfortunately, I can't." } },
    wrong: { t: "Titta i kalendern!", en: "Look in the calendar!" },
  },
  lines: {
    invite: { t: "Kan jag hjälpa till?", en: "Can I help?" },
    notYet: { t: "Lär dig klockan först!", en: "Learn to tell the time first!" },
    intro: [
      { t: "Hej! Vad bra att du kom!", en: "Hi! Good that you came!" },
      { t: "I dag kommer alla med sina klockor. Lyssna noga på vilken tid de behöver.", en: "Everyone's bringing their clocks today. Listen carefully to what time they need." },
      { t: "Vrid visarna och sedan: klar!", en: "Turn the hands, and then: done!" },
    ],
    title: { t: "Klockverkstaden", en: "The clock workshop" },
    howTo: { t: "Vrid den lilla och den stora visaren.", en: "Turn the small hand and the big hand." },
    hour: { t: "timme", en: "hour" },
    minute: { t: "minut", en: "minute" },
    ready: { t: "Klar!", en: "Done!" },
    calendar: { t: "Kalender", en: "Calendar" },
    busy: { t: "upptagen", en: "busy" },
    thanks: [
      { t: "Tack! Den går igen!", en: "Thanks! It's running again!" },
      { t: "Toppen, tack så mycket!", en: "Great, thanks a lot!" },
      { t: "Perfekt! Tick, tack!", en: "Perfect! Tick, tock!" },
    ],
    repeat: { t: "Förlåt?", en: "Pardon?" },
    late: { t: "Åh, det är redan stängt!", en: "Oh, it's already closed!" },
    done: [
      { t: "Alla klockor går! Du är en riktig urmakare!", en: "All the clocks are running! You're a real clockmaker!" },
      { t: "Bra jobbat! Tack för hjälpen.", en: "Good job! Thanks for the help." },
      { t: "Puh, tiden går så fort! Tack ändå.", en: "Phew, time flies so fast! Thanks anyway." },
    ],
    harder: { t: "I morgon kommer ännu fler klockor!", en: "Tomorrow even more clocks are coming!" },
    again: { t: "En gång till!", en: "Once more!" },
    back: { t: "Tillbaka till byn", en: "Back to the village" },
    clock: { t: "Stängning", en: "closing time" },
  },
};
