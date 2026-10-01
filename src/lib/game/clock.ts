import type { TargetLanguageCode } from "@/lib/learning/languages";
import { foldsFor, normalizeText } from "@/lib/learning/text";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// Helping at the clockmaker's. Customers bring stopped clocks and say what
// time to set ("Stell sie bitte auf halb vier."), and you turn the hands;
// some ask what time it is by the big wall clock and you say it; later some
// ask when they can collect it ("Passt es dir am Freitag um drei Uhr?") and
// you answer from the calendar.

export type Minutes = 0 | 15 | 30 | 45;
export type Time = { h: number; m: Minutes };
// How a time is said: three o'clock, half (to) four, quarter past, quarter to.
export type TimeForm = "oclock" | "half" | "past" | "to";

export function formOf(time: Time): TimeForm {
  return time.m === 0 ? "oclock" : time.m === 30 ? "half" : time.m === 15 ? "past" : "to";
}

// The hour a time is named after: "halb vier" and "Viertel vor vier" are named after four.
export function namedHour(time: Time) {
  return time.m >= 30 ? (time.h % 12) + 1 : time.h;
}

export type ClockDay = { slug: string; name: Line };

export type ClockConfig = {
  host: VillagerId;
  // Concepts for the numbers one to twelve.
  numbers: string[];
  forms: Record<TimeForm, string>;
  // "halb vier" / "half past three".
  say(time: Time): Line;
  // What the learner may say for a time: words only, parsed back into a time.
  parse(text: string, code: TargetLanguageCode): Time | "digits" | null;
  setRequest(time: Time, variant: number): Line;
  // The customer, handed the wrong time: "Nein, das ist halb fünf! Ich brauche halb vier."
  wrongTime(want: Time, got: Time): Line;
  ask: Line;
  told(time: Time): Line;
  toldWrong: Line;
  words: Line;
  appointments: {
    days: ClockDay[];
    ask(day: ClockDay, hour: number): Line;
    yes: { concept: string; line: Line };
    no: { concept: string; line: Line };
    wrong: Line;
  } | null;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    title: Line;
    howTo: Line;
    hour: Line;
    minute: Line;
    ready: Line;
    calendar: Line;
    busy: Line;
    thanks: Line[];
    repeat: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
    clock: Line;
  };
};

export type ClockLevel = {
  customers: number;
  forms: TimeForm[];
  // How many customers also ask what time it is.
  tells: number;
  appointments: boolean;
  heard: boolean;
  seconds: number;
};

export const CLOCK_LEVELS: ClockLevel[] = [
  { customers: 3, forms: ["oclock", "half"], tells: 0, appointments: false, heard: false, seconds: 200 },
  { customers: 4, forms: ["oclock", "half", "past", "to"], tells: 1, appointments: false, heard: false, seconds: 240 },
  { customers: 4, forms: ["oclock", "half", "past", "to"], tells: 2, appointments: true, heard: false, seconds: 280 },
  { customers: 4, forms: ["half", "past", "to"], tells: 2, appointments: true, heard: true, seconds: 270 },
  { customers: 5, forms: ["half", "past", "to"], tells: 3, appointments: true, heard: true, seconds: 300 },
];

export function clockLevel(index: number) {
  return CLOCK_LEVELS[Math.max(0, Math.min(CLOCK_LEVELS.length - 1, index))];
}

// Jonas's week: on each working day, a few hours are already taken.
export type Calendar = Record<string, number[]>;
export const CALENDAR_HOURS = [9, 10, 11, 12, 1, 2, 3, 4, 5];

export type Customer = {
  set: Time;
  request: Line;
  // The wall clock's time when they ask what time it is.
  tell: Time | null;
  appointment: { day: ClockDay; hour: number; line: Line; free: boolean } | null;
};

export type CustomerOptions = {
  level: ClockLevel;
  forms: TimeForm[];
  hours: number[];
  days: string[];
  appointments: boolean;
  weight?: (slug: string) => number;
  seed: number;
};

export function makeCalendar(config: ClockConfig, seed: number): Calendar {
  const random = mulberry32(seed);
  const calendar: Calendar = {};
  for (const day of config.appointments?.days ?? []) {
    calendar[day.slug] = CALENDAR_HOURS.filter(() => random() < 0.4);
  }
  return calendar;
}

// Which way a customer asks for a time is fixed per time, so each time has one
// recording per voice rather than two.
export const requestVariant = (time: Time) => (time.h + time.m / 15) % 2;
// Likewise whether a man or a woman brings in a clock for this time, so their
// "I need …" is recorded in one voice.
export const customerGender = (time: Time): "man" | "woman" => ((time.h * 5 + (time.m / 15) * 3) % 2 ? "woman" : "man");

export function makeCustomers(config: ClockConfig, calendar: Calendar, options: CustomerOptions): Customer[] {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const forms = options.level.forms.filter((f) => options.forms.includes(f));
  const hours = options.hours.length ? options.hours : [3];
  const time = (): Time => {
    const form = forms.length ? forms[Math.floor(random() * forms.length)] : "oclock";
    const m: Minutes = form === "oclock" ? 0 : form === "half" ? 30 : form === "past" ? 15 : 45;
    // Weighted by the hour the time is *named* after, which is the word you hear.
    const named = pickWeighted(hours, (h) => weight(config.numbers[h - 1]), random);
    const h = m >= 30 ? ((named + 10) % 12) + 1 : named;
    return { h, m };
  };
  const days = (config.appointments?.days ?? []).filter((d) => options.days.includes(d.slug));
  const customers: Customer[] = [];
  let tells = options.level.tells;
  let last = "";
  for (let i = 0; i < options.level.customers; i++) {
    let set = time();
    // Not the same time twice running.
    for (let tries = 0; tries < 5 && `${set.h}:${set.m}` === last; tries++) set = time();
    last = `${set.h}:${set.m}`;
    const left = options.level.customers - i;
    const tell = tells > 0 && random() < tells / left ? time() : null;
    if (tell) tells--;
    let appointment: Customer["appointment"] = null;
    if (options.level.appointments && options.appointments && days.length && config.appointments) {
      const day = days[Math.floor(random() * days.length)];
      const hour = [9, 10, 11, 2, 3, 4][Math.floor(random() * 6)];
      appointment = { day, hour, line: config.appointments.ask(day, hour), free: !(calendar[day.slug] ?? []).includes(hour) };
    }
    customers.push({ set, request: config.setRequest(set, requestVariant(set)), tell, appointment });
  }
  return customers;
}

function pickWeighted<T>(items: T[], weight: (item: T) => number, random: () => number) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function sameTime(a: Time, b: Time) {
  return a.h === b.h && a.m === b.m;
}

// Turning the hands: minutes go round in quarters and carry the hour with them.
export function turn(time: Time, hand: "hour" | "minute", steps: number): Time {
  if (hand === "hour") return { h: ((time.h - 1 + steps + 1200) % 12) + 1, m: time.m };
  const quarters = time.h * 4 + time.m / 15 + steps;
  const wrapped = ((quarters % 48) + 48) % 48;
  const h = Math.floor(wrapped / 4) || 12;
  return { h, m: ((wrapped % 4) * 15) as Minutes };
}

// Number words in a learner's sentence, folded so a missing umlaut still counts.
export function numberIn(words: string[], numbers: Record<string, number>, code: TargetLanguageCode) {
  const folds = [(s: string) => s, ...foldsFor(code)];
  for (const word of words) {
    for (const [name, value] of Object.entries(numbers)) {
      if (folds.some((f) => f(word) === f(normalizeText(name, code)))) return value;
    }
  }
  return null;
}

export function clockStars(helped: number, customers: number, timeLeft: number) {
  if (helped >= customers) return timeLeft >= 0.25 ? 3 : 2;
  return helped >= customers / 2 ? 1 : 0;
}

export function allTimes(): Time[] {
  const times: Time[] = [];
  for (let h = 1; h <= 12; h++) for (const m of [0, 15, 30, 45] as Minutes[]) times.push({ h, m });
  return times;
}

// Everything the workshop can say, for the gloss audit and the voice catalog.
export function allClockLines(config: ClockConfig): Line[] {
  const lines: Line[] = [];
  for (const time of allTimes()) {
    lines.push(config.say(time), config.setRequest(time, 0), config.setRequest(time, 1), config.told(time));
    lines.push(config.wrongTime(time, { h: (time.h % 12) + 1, m: time.m }));
  }
  const appointments = config.appointments;
  if (appointments) {
    for (const day of appointments.days) for (const hour of [9, 10, 11, 2, 3, 4]) lines.push(appointments.ask(day, hour));
    lines.push(appointments.yes.line, appointments.no.line, appointments.wrong);
  }
  lines.push(config.ask, config.toldWrong, config.words);
  return lines;
}
