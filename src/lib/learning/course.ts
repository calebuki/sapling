import type { TargetLanguageCode } from "./languages.ts";
import type { ConceptKind } from "@/types/learning";
import danishAudio from "../../../public/audio/danish/manifest.json";
import swedishAudio from "../../../public/audio/swedish/manifest.json";

// Course shapes shared by every language. The course data itself lives in
// src/content/<language>; this module never imports it, so client code only
// pulls in the language it is actually playing.

export type SpeechVoice =
  | "da-DK-ChristelNeural"
  | "da-DK-JeppeNeural"
  | "sv-SE-SofieNeural"
  | "sv-SE-MattiasNeural"
  | "de-DE-KatjaNeural"
  | "de-DE-ConradNeural";

export type FallbackPattern = {
  requiredPhrase: string;
  minimumTokens: number;
};

export type LessonExercise = {
  conceptSlug: string;
  audioId: string;
  voice: SpeechVoice;
  mode: "repeat" | "guided" | "open";
  eyebrow: string;
  prompt: string;
  expected: string;
  // English for the expected answer when the prompt is an instruction ("Ask their name.").
  meaning?: string;
  fallbackPatterns?: FallbackPattern[];
  // Other natural answers, as patterns over the normalized answer.
  accept?: string[];
  note: string;
};

export type ScenarioWord = {
  target: string;
  english: string;
};

export type LessonSupport = {
  title: string;
  idea?: string;
  words: ScenarioWord[];
  starters?: ScenarioWord[];
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  description: string;
  support?: LessonSupport;
  exercises: LessonExercise[];
};

export type ListenSpeakItem = {
  id: string;
  conceptSlug: string;
  audioId: string;
  voice: SpeechVoice;
  text: string;
  meaning: string;
  options: string[];
};

export type SpeechClip = {
  id: string;
  text: string;
  voice: SpeechVoice;
  languageCode: TargetLanguageCode;
};

export type Cefr = "A1" | "A2";

// A themed slice of the course, taught by one villager on the island.
export type Unit = {
  id: string;
  level: Cefr;
  villager: string;
  title: { t: string; en: string };
  about: string;
  slugs: string[];
};

// What the concept catalog needs to know about each course item.
export type ConceptSeed = {
  slug: string;
  kind: ConceptKind;
  canonicalForm: string;
  gloss: string;
  description: string;
  level: Cefr;
  unit: string;
};

export type Course = {
  languageCode: TargetLanguageCode;
  units: Unit[];
  lessons: Lesson[];
  listenSpeakItems: ListenSpeakItem[];
  concepts: ConceptSeed[];
};

export function unitOf(course: Course, slug: string) {
  return course.units.find((unit) => unit.slugs.includes(slug)) ?? null;
}

export function exerciseFor(course: Course, slug: string) {
  for (const lesson of course.lessons) {
    const exercise = lesson.exercises.find((e) => e.conceptSlug === slug);
    if (exercise) return { lesson, exercise };
  }
  return null;
}

export function speechClipsOf(course: Course): SpeechClip[] {
  const clips = new Map<string, SpeechClip>();
  for (const lesson of course.lessons) {
    for (const exercise of lesson.exercises) {
      clips.set(exercise.audioId, { id: exercise.audioId, text: exercise.expected, voice: exercise.voice, languageCode: course.languageCode });
    }
  }
  for (const item of course.listenSpeakItems) {
    clips.set(item.audioId, { id: item.audioId, text: item.text, voice: item.voice, languageCode: course.languageCode });
  }
  return [...clips.values()];
}

// Only phrases that were recorded ahead of time have a static clip; everything
// else is spoken by the neural voice on demand.
const recorded: Partial<Record<TargetLanguageCode, { directory: string; versions: Record<string, string> }>> = {
  da: { directory: "danish", versions: danishAudio },
  sv: { directory: "swedish", versions: swedishAudio },
};

export function getSpeechAudioUrl(languageCode: TargetLanguageCode, id: string) {
  const audio = recorded[languageCode];
  const version = audio?.versions[id];
  return audio && version ? `/audio/${audio.directory}/${encodeURIComponent(id)}.mp3?v=${version}` : null;
}
