import type { TargetLanguageCode } from "@/lib/learning/languages";
import { capitalize, normalizeText } from "@/lib/learning/text";
import type { Line } from "./line";
import type { VoiceGender } from "./voices";

// Each phrase a villager teaches is practised as a turn in a real exchange:
// someone says the cue, the learner answers, they react. Every phrase has
// several variants (other people, other situations, sometimes another right
// answer) so a repeat never replays the same scene.

export type SceneTime = "yesterday" | "today" | "tomorrow";

export type SceneBeat = {
  // One English sentence setting the scene; the target language lives in the cue.
  situation: string;
  speaker: string;
  cue: Line;
  reaction: Line;
  // A different right answer for this variant ("Det är vatten." instead of "Det är kaffe.").
  expect?: Line;
  // Other ways to say it right, as patterns over the normalised answer.
  accept?: string[];
  // Reactions that depend on what was actually said; {name} is the learner's name.
  branches?: Array<{ when: string; reaction: Line }>;
  // Phrases that would also be a fine reply, so never offered as wrong choices.
  notWith?: string[];
  // Who joins the guest book when this goes well (defaults to the speaker).
  guest?: string;
  time?: SceneTime;
  departure?: string;
  ride?: string;
  fast?: boolean;
  pitch?: number;
};

// Special listening drills some phrases get instead of the generic "pick a reply".
export type DrillKind = "who" | "sign" | "board";

export type SceneLines = Record<
  | "youCanSay"
  | "answer"
  | "whoIsTalking"
  | "whatDoYouSay"
  | "whichSign"
  | "whichTrain"
  | "when"
  | "puzzle"
  | "puzzleHelp"
  | "guestBook"
  | "departures"
  | "journey"
  | "riding"
  | "keepTalking"
  | "you"
  | "stamps",
  Line
>;

export type SceneExtras = {
  lines: SceneLines;
  // Names that turn up in introductions, and how a name tag greets you.
  guestNames: string[];
  // Whether each scene speaker who isn't a villager is a man or a woman, for
  // their voice. Unlisted speakers ("a tourist") go by their pitch.
  speakers: Record<string, VoiceGender>;
  nameTag: string;
  // How learners introduce themselves, capturing the name ("jag heter (\p{L}+)").
  namePattern: string;
  departures: Array<{ time: string; to: string; track: string }>;
  track: Line;
  announcements: Array<{ t: string; en: string; to: string }>;
  signs: Array<{ id: string; line: Line }>;
  whereQuestions: Array<{ t: string; en: string; sign: string }>;
  whenSentences: Record<string, Array<{ t: string; en: string; time: SceneTime }>>;
  journey: string[];
  calendar: Array<{ id: SceneTime; line: Line }>;
};

// Stable per attempt, different across attempts: repeats land on another variant.
export function pickVariant<T>(variants: readonly T[], key: string) {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return variants[Math.abs(hash) % variants.length];
}

// Did the learner say it right in one of the other accepted ways?
export function acceptsAnswer(patterns: readonly string[] | undefined, answer: string, code: TargetLanguageCode) {
  const text = normalizeText(answer, code);
  return Boolean(text) && (patterns ?? []).some((p) => new RegExp(p, "u").test(text));
}

// The name the learner introduced themselves with, if they did.
export function nameFrom(answer: string, extras: SceneExtras, code: TargetLanguageCode) {
  const match = new RegExp(extras.namePattern, "iu").exec(answer);
  return match ? capitalize(match[1], code) : null;
}

// Pick the reaction that fits what the learner actually said.
export function reactionTo(beat: SceneBeat, answer: string, fallbackName: string, extras: SceneExtras, code: TargetLanguageCode): Line {
  const text = normalizeText(answer, code);
  const chosen = beat.branches?.find((b) => new RegExp(b.when, "u").test(text))?.reaction ?? beat.reaction;
  const name = nameFrom(answer, extras, code) ?? fallbackName;
  return { t: chosen.t.replaceAll("{name}", name), en: chosen.en.replaceAll("{name}", name) };
}

// Names in the introduction listening drills ("Hej, jag heter Sara.").
export function nameIn(text: string, extras: SceneExtras) {
  return extras.guestNames.find((n) => text.includes(n)) ?? null;
}

export function trackLabel(extras: SceneExtras, track: string): Line {
  return { t: extras.track.t.replace("{n}", track), en: extras.track.en.replace("{n}", track) };
}
