import type { Line } from "./line";

// A short lesson before a job: what you'll be doing, the words it uses (each
// to listen to), the grammar it leans on, and a quick check. Cards marked
// `from` a later level come in when that level first does something new.

type Since = { from?: number };

export type JobLessonCard = Since &
  (
    | { kind: "how"; title: Line; steps: string[] }
    // Course concepts, shown as the course writes them, only once met.
    | { kind: "words"; title: Line; slugs: string[] }
    | { kind: "grammar"; title: Line; body: string; examples: Line[] }
  );

export type JobLessonCheck = Since & { question: string; options: string[]; answer: string; why: string };

export type JobLesson = { cards: JobLessonCard[]; checks: JobLessonCheck[] };

// The pack's lessons, by job, and the words the lesson screen itself uses.
export type JobLessons = {
  labels: { badge: Line; open: Line; newAtLevel: Line };
  jobs: Partial<Record<string, JobLesson>>;
};

const since = (x: Since) => x.from ?? 0;

// What to show for a level: everything up to it, or only what's new there.
export function lessonFor(lesson: JobLesson, level: number, onlyNew = false) {
  const fits = (x: Since) => (onlyNew ? since(x) === level : since(x) <= level);
  const checks = lesson.checks.filter(fits);
  // The newest check that fits: the one about what this level brings.
  const check = checks.sort((a, b) => since(b) - since(a))[0] ?? null;
  return { cards: lesson.cards.filter(fits), check };
}

// Whether the lesson should open by itself before a run: the first time you
// help at all, and the first time at a level that brings something new.
export function lessonOpensFor(lesson: JobLesson | undefined, level: number, stars: number[] | undefined): "all" | "new" | null {
  if (!lesson) return null;
  if (!stars?.length) return lessonFor(lesson, level).cards.length ? "all" : null;
  if (stars[level] !== undefined) return null;
  return lessonFor(lesson, level, true).cards.length ? "new" : null;
}

export function allLessonLines(lessons: JobLessons): Line[] {
  const lines: Line[] = [...Object.values(lessons.labels)];
  for (const lesson of Object.values(lessons.jobs)) {
    for (const card of lesson?.cards ?? []) {
      lines.push(card.title);
      if (card.kind === "grammar") lines.push(...card.examples);
    }
  }
  return lines;
}
