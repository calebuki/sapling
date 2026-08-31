import { getCourse } from "@/lib/learning/course";
import type { Concept } from "@/types/learning";

const exercises = getCourse("sv").lessons.flatMap((lesson) => lesson.exercises);
const conceptsBySlug = new Map<string, Concept>();

for (const [index, exercise] of exercises.entries()) {
  if (conceptsBySlug.has(exercise.conceptSlug)) {
    continue;
  }

  conceptsBySlug.set(exercise.conceptSlug, {
    id: `demo-sv-${exercise.conceptSlug}`,
    languageCode: "sv",
    slug: exercise.conceptSlug,
    kind: exercise.mode === "repeat" ? "word" : "chunk",
    canonicalForm: exercise.expected.replace(/[.!?]$/, ""),
    gloss: exercise.prompt,
    description: exercise.note,
    sortOrder: 1_000 + index,
  });
}

export const swedishDemoConcepts = [...conceptsBySlug.values()];
