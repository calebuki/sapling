import type { Course } from "@/lib/learning/course";
import { buildUnits, itemGlosses } from "../dsl";
import { a1 } from "./units-a1";

// The Vietnamese course, taught by the people of Cát Bà. Only A1 so far.

// Classifiers a noun can go without ("xoài" for "quả xoài").
export const articles = ["con", "cái", "quả", "chiếc"] as const;

const built = buildUnits("vi", a1, {
  voices: ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural"],
  articles,
});

export const course: Course = {
  languageCode: "vi",
  units: built.units,
  lessons: built.lessons,
  listenSpeakItems: built.listenSpeakItems,
  concepts: built.concepts,
};

// Hover glosses the course gives for free: every single-word item.
export const courseGlosses = itemGlosses(built, articles);
