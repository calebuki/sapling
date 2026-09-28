import type { Course } from "@/lib/learning/course";
import { buildUnits, itemGlosses } from "../dsl";
import { a1 } from "./units-a1";
import { a2 } from "./units-a2";

// The German course, A1 to A2, taught by the people of Tannenau.

export const articles = ["der", "die", "das", "ein", "eine"] as const;

const built = buildUnits("de", [...a1, ...a2], {
  voices: ["de-DE-KatjaNeural", "de-DE-ConradNeural"],
  articles,
});

export const course: Course = {
  languageCode: "de",
  units: built.units,
  lessons: built.lessons,
  listenSpeakItems: built.listenSpeakItems,
  concepts: built.concepts,
};

// Hover glosses the course gives for free: every single-word item.
export const courseGlosses = itemGlosses(built, articles);
