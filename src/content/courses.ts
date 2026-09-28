import type { Course } from "@/lib/learning/course";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { course as da } from "./da/course";
import { course as de } from "./de/course";
import { course as sv } from "./sv/course";

// Every language's course in one place, for server routes, scripts and tests.
// Client code gets its course from the island it loaded instead, so a player
// only downloads the language they are playing.
const courses: Record<TargetLanguageCode, Course> = { da, de, sv };

export function getCourse(languageCode: TargetLanguageCode) {
  return courses[languageCode];
}

export function allCourses() {
  return Object.values(courses);
}
