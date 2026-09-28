import type { Course } from "@/lib/learning/course";
import { danishLessons, danishListenSpeakItems } from "./legacy-course";

// Danish keeps its prototype course until it gets an island of its own. It has
// no units yet, so the hub lists it as coming soon.
export const course: Course = {
  languageCode: "da",
  units: [],
  lessons: danishLessons,
  listenSpeakItems: danishListenSpeakItems,
  concepts: [],
};
