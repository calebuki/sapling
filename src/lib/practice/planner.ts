import { getPracticeScenarios } from "@/lib/practice/scenarios";
import type { Concept, LearnerConceptState } from "@/types/learning";
import type { PracticeRecommendation, PracticeSnapshot } from "@/types/practice";
import type { TargetLanguageCode } from "@/lib/learning/languages";

function average(values: number[]) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

export function choosePracticeScenario({
  languageCode,
  concepts,
  states,
  snapshot,
}: {
  languageCode: TargetLanguageCode;
  concepts: Concept[];
  states: LearnerConceptState[];
  snapshot: PracticeSnapshot;
}): PracticeRecommendation {
  const conceptBySlug = new Map(concepts.map((concept) => [concept.slug, concept]));
  const stateByConceptId = new Map(states.map((state) => [state.conceptId, state]));
  const recent = new Set(snapshot.recentScenarioIds.slice(0, 2));

  const ranked = getPracticeScenarios(languageCode)
    .map((scenario, index) => {
      const encounteredConceptSlugs = [
        ...scenario.requiredConceptSlugs,
        ...scenario.optionalConceptSlugs,
      ].filter((slug) => {
        const concept = conceptBySlug.get(slug);
        return concept
          ? (stateByConceptId.get(concept.id)?.exposureCount ?? 0) > 0
          : false;
      });
      const encounteredRequired = scenario.requiredConceptSlugs.filter((slug) =>
        encounteredConceptSlugs.includes(slug),
      );
      const available = encounteredRequired.length >= scenario.minimumEncountered;
      const strengths = encounteredRequired.flatMap((slug) => {
        const concept = conceptBySlug.get(slug);
        const state = concept ? stateByConceptId.get(concept.id) : undefined;
        return state
          ? [state.recall, state.production, state.recognitionAudio].filter(
              (value): value is number => typeof value === "number",
            )
          : [];
      });
      const readiness = average(strengths);
      const targetZone = 1 - Math.min(1, Math.abs(readiness - 0.48) / 0.48);
      const coverage =
        scenario.requiredConceptSlugs.length === 0
          ? 1
          : encounteredRequired.length / scenario.requiredConceptSlugs.length;
      const novelty = recent.has(scenario.id) ? 0 : 1;
      const score =
        (available ? 2 : -2) +
        coverage * 0.9 +
        targetZone * 0.55 +
        novelty * 0.25 -
        index * 0.015;

      return {
        scenario,
        readiness,
        encounteredConceptSlugs,
        scaffolded: readiness < 0.35 || coverage < 0.7,
        reason:
          encounteredConceptSlugs.length === 0
            ? "A gentle first conversation"
            : readiness < 0.45
              ? "Ready to use with a little support"
              : "The best next stretch for what you know",
        score,
      };
    })
    .filter((candidate) => candidate.score >= 0)
    .toSorted((left, right) => right.score - left.score);

  const selected = ranked[0];
  if (selected) {
    const { score: _score, ...recommendation } = selected;
    return recommendation;
  }

  const fallback = getPracticeScenarios(languageCode)[0];
  return {
    scenario: fallback,
    readiness: 0,
    encounteredConceptSlugs: [],
    scaffolded: true,
    reason: "A gentle first conversation",
  };
}
