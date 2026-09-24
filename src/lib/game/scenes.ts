import type { Line, VillagerId } from "./villagers";

// Each phrase a villager teaches is practised as a turn in a real exchange:
// someone says the cue, the learner answers with the phrase, they react.

export type SceneBeat = {
  // One English sentence setting the scene; the Swedish lives in the cue.
  situation: string;
  speaker: string;
  cue: Line;
  reaction: Line;
  // Who joins Elin's guest book when this goes well (defaults to the speaker).
  guest?: string;
  // Astrid's calendar.
  time?: "igår" | "idag" | "imorgon";
  // Stina's station: highlight a departure, ride to a stop, or talk too fast to follow.
  departure?: string;
  ride?: string;
  fast?: boolean;
  pitch?: number;
};

const elin: Record<string, SceneBeat> = {
  hej: {
    situation: "A passenger steps off the ferry and waves at you.",
    speaker: "Anna",
    cue: { sv: "Hej!", en: "Hi!" },
    reaction: { sv: "Vilken fin ö!", en: "What a lovely island!" },
    pitch: 1.2,
  },
  tack: {
    situation: "Erik picks up the bag you dropped and hands it back.",
    speaker: "Erik",
    cue: { sv: "Varsågod, din väska!", en: "Here you go, your bag!" },
    reaction: { sv: "Ingen orsak!", en: "No problem!" },
    pitch: 0.85,
  },
  ja: {
    situation: "Sara wonders if you're new here. You are!",
    speaker: "Sara",
    cue: { sv: "Är du ny på ön?", en: "Are you new on the island?" },
    reaction: { sv: "Vad roligt! Välkommen!", en: "How fun! Welcome!" },
    pitch: 1.15,
  },
  nej: {
    situation: "Nils points at a red rowing boat. It isn't yours.",
    speaker: "Nils",
    cue: { sv: "Är det din båt?", en: "Is that your boat?" },
    reaction: { sv: "Okej, då är det Elins båt.", en: "Okay, then it's Elin's boat." },
    pitch: 0.8,
  },
  "jag-heter": {
    situation: "Maja wants to know who you are.",
    speaker: "Maja",
    cue: { sv: "Hej! Vad heter du?", en: "Hi! What's your name?" },
    reaction: { sv: "Vilket fint namn!", en: "What a nice name!" },
    pitch: 1.25,
  },
  "vad-heter-du": {
    situation: "Someone new says hi. Ask what they're called.",
    speaker: "?",
    guest: "Olle",
    cue: { sv: "Hej hej!", en: "Hi there!" },
    reaction: { sv: "Jag heter Olle.", en: "My name is Olle." },
    pitch: 0.9,
  },
  "trevligt-att-traeffas": {
    situation: "Olle introduces himself. Be friendly back.",
    speaker: "Olle",
    cue: { sv: "Hej, jag heter Olle.", en: "Hi, my name is Olle." },
    reaction: { sv: "Detsamma!", en: "Likewise!" },
    pitch: 0.9,
  },
  "vet-inte": {
    situation: "A tourist asks you something you have no idea about.",
    speaker: "Lars",
    cue: { sv: "När går nästa båt?", en: "When does the next boat leave?" },
    reaction: { sv: "Okej, jag frågar Elin.", en: "Okay, I'll ask Elin." },
    pitch: 0.75,
  },
  "det-aer": {
    situation: "Anna points at the cup in your hand.",
    speaker: "Anna",
    cue: { sv: "Vad är det?", en: "What is that?" },
    reaction: { sv: "Mmm, det luktar gott!", en: "Mmm, it smells good!" },
    pitch: 1.2,
  },
};

const stina: Record<string, SceneBeat> = {
  "var-ligger-stationen": {
    situation: "You're lost on the mainland. A local stops to help.",
    speaker: "Ingrid",
    cue: { sv: "Hej! Kan jag hjälpa dig?", en: "Hi! Can I help you?" },
    reaction: { sv: "Den ligger där borta, till vänster.", en: "It's over there, on the left." },
    pitch: 1.1,
  },
  "taget-till-stockholm": {
    situation: "A train waits on platform 2. Check with Stina before you get on.",
    speaker: "Stina",
    cue: { sv: "God dag! Biljetter, tack.", en: "Good day! Tickets, please." },
    reaction: { sv: "Ja, det gör det. Trevlig resa!", en: "Yes, it does. Have a nice trip!" },
    departure: "Stockholm",
  },
  "jag-ska-av-haer": {
    situation: "You're going to Hamnstad. Tell Stina when the train gets there.",
    speaker: "Stina",
    cue: { sv: "Nästa station: Hamnstad.", en: "Next station: Hamnstad." },
    reaction: { sv: "Varsågod, dörren är öppen!", en: "Go ahead, the door is open!" },
    ride: "Hamnstad",
  },
  "jag-foerstar-inte": {
    situation: "A passenger rattles off a question in fast Swedish. You catch nothing.",
    speaker: "Passagerare",
    cue: { sv: "Ursäkta, vet du om vi byter tåg i Uppsala eller om vi åker direkt?", en: "Excuse me, do you know if we change trains in Uppsala or go straight through?" },
    reaction: { sv: "Förlåt! Byter vi tåg i Uppsala?", en: "Sorry! Do we change trains in Uppsala?" },
    fast: true,
    pitch: 0.9,
  },
  "kan-du-upprepa": {
    situation: "Stina tells you your platform, but a train roars past.",
    speaker: "Stina",
    cue: { sv: "Tåget till Göteborg går från spår tre.", en: "The train to Gothenburg leaves from platform three." },
    reaction: { sv: "Spår tre! Tåget till Göteborg går från spår tre.", en: "Platform three! The train to Gothenburg leaves from platform three." },
    departure: "Göteborg",
    fast: true,
  },
  "prata-langsammare": {
    situation: "Stina explains the timetable way too fast.",
    speaker: "Stina",
    cue: { sv: "Tåget går kvart över tio från spår två, men du byter i Uppsala.", en: "The train leaves at quarter past ten from platform two, but you change in Uppsala." },
    reaction: { sv: "Förlåt! Tåget går … kvart över tio.", en: "Sorry! The train leaves … at quarter past ten." },
    fast: true,
  },
  kan: {
    situation: "Stina needs a hand at the station tomorrow. You're free.",
    speaker: "Stina",
    cue: { sv: "Kan du hjälpa mig imorgon?", en: "Can you help me tomorrow?" },
    reaction: { sv: "Tack, vad snällt!", en: "Thanks, how kind!" },
  },
  behoever: {
    situation: "It's a long trip and you're thirsty.",
    speaker: "Stina",
    cue: { sv: "Vad behöver du?", en: "What do you need?" },
    reaction: { sv: "Det finns vatten i kiosken.", en: "There's water at the kiosk." },
  },
  finns: {
    situation: "A hungry tourist asks you about Lilla Ö.",
    speaker: "Turist",
    cue: { sv: "Finns det ett kafé på ön?", en: "Is there a café on the island?" },
    reaction: { sv: "Toppen, tack!", en: "Great, thanks!" },
    pitch: 0.85,
  },
};

const astrid: Record<string, SceneBeat> = {
  "v2-idag": {
    situation: "Astrid asks about your day. Start your answer with “Idag”.",
    speaker: "Astrid",
    cue: { sv: "Vad gör du idag?", en: "What are you doing today?" },
    reaction: { sv: "Hemma? Då kan du komma hit sen!", en: "At home? Then you can come here later!" },
    time: "idag",
  },
  negation: {
    situation: "Astrid hopes you'll come to the garden today, but you can't.",
    speaker: "Astrid",
    cue: { sv: "Kommer du till trädgården idag?", en: "Are you coming to the garden today?" },
    reaction: { sv: "Synd! Kanske imorgon då.", en: "Shame! Maybe tomorrow then." },
    time: "idag",
  },
  "past-gick": {
    situation: "Astrid wonders where you went yesterday. You went home.",
    speaker: "Astrid",
    cue: { sv: "Vart gick du igår?", en: "Where did you go yesterday?" },
    reaction: { sv: "Hem? Det låter mysigt.", en: "Home? That sounds cosy." },
    time: "igår",
  },
  "perfect-har": {
    situation: "Astrid is curious about the mainland. You've been there.",
    speaker: "Astrid",
    cue: { sv: "Har du varit i Stockholm?", en: "Have you been to Stockholm?" },
    reaction: { sv: "Vad spännande! Jag har aldrig varit där.", en: "How exciting! I've never been there." },
  },
  kanske: {
    situation: "Astrid invites you, but you're not sure yet.",
    speaker: "Astrid",
    cue: { sv: "Vill du fika med mig imorgon?", en: "Do you want to have fika with me tomorrow?" },
    reaction: { sv: "Säg till när du vet!", en: "Let me know when you know!" },
    time: "imorgon",
  },
  "ska-vi-infinitive": {
    situation: "Astrid wants to visit the mainland tomorrow. Suggest the train.",
    speaker: "Astrid",
    cue: { sv: "Jag vill åka till Stockholm imorgon.", en: "I want to go to Stockholm tomorrow." },
    reaction: { sv: "Ja, gärna! Vi tar tåget.", en: "Yes, gladly! We'll take the train." },
    time: "imorgon",
  },
};

export const sceneBeats: Partial<Record<VillagerId, Record<string, SceneBeat>>> = { elin, stina, astrid };

export const guestNames = ["Anna", "Erik", "Sara", "Nils", "Maja", "Olle", "Lars"];

// Names in Elin's listening drills ("Hej, jag heter Sara.").
export function nameIn(text: string) {
  return guestNames.find((n) => text.includes(n)) ?? null;
}

export const departures = [
  { time: "10:15", to: "Stockholm", track: "2" },
  { time: "10:40", to: "Uppsala", track: "1" },
  { time: "11:05", to: "Göteborg", track: "3" },
];

export const journey = ["Lilla Ö", "Bron", "Hamnstad", "Uppsala", "Stockholm"];

export const sceneLines = {
  youCanSay: { sv: "Du kan svara:", en: "You can answer:" },
  answer: { sv: "Svara!", en: "Answer!" },
  whoIsTalking: { sv: "Vem pratar?", en: "Who is talking?" },
  guestBook: { sv: "Gästbok", en: "Guest book" },
  departures: { sv: "Avgångar", en: "Departures" },
  journey: { sv: "Resan", en: "The journey" },
  garden: { sv: "Trädgården", en: "The garden" },
  tooFast: { sv: "För snabbt!", en: "Too fast!" },
  riding: { sv: "Tåget rullar…", en: "The train is rolling…" },
} satisfies Record<string, Line>;

export const calendar: Array<{ id: NonNullable<SceneBeat["time"]>; line: Line }> = [
  { id: "igår", line: { sv: "Igår", en: "Yesterday" } },
  { id: "idag", line: { sv: "Idag", en: "Today" } },
  { id: "imorgon", line: { sv: "Imorgon", en: "Tomorrow" } },
];
