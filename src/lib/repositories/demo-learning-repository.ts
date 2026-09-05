import { demoConcepts, initialDemoStates } from "@/lib/learning/demo-data";
import { swedishDemoConcepts } from "@/lib/learning/swedish-demo-data";
import { getPracticeScenario } from "@/lib/practice/scenarios";
import {
  isTargetLanguageCode,
  type TargetLanguageCode,
} from "@/lib/learning/languages";
import {
  applyDemoRepair,
  applyDemoPracticeEvidence,
  applyDemoRetrievalAttempt,
  applyDemoListeningAttempt,
  applyDemoSpeakingAttempt,
  createEmptyState,
} from "@/lib/learning/model";
import type { LearningRepository } from "@/lib/repositories/types";
import type {
  LearnerConceptState,
  ListeningAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";
import type {
  CharacterContinuity,
  LearnerMemory,
  PracticeSnapshot,
} from "@/types/practice";

const targetLanguageStorageKey = "sapling.demo.target-language.v1";

function stateStorageKey(languageCode: TargetLanguageCode) {
  return languageCode === "da"
    ? "sapling.demo.concept-states.v1"
    : "sapling.demo.concept-states.sv.v1";
}

function eventStorageKey(languageCode: TargetLanguageCode) {
  return languageCode === "da"
    ? "sapling.demo.learning-events.v1"
    : "sapling.demo.learning-events.sv.v1";
}

function practiceStorageKey(languageCode: TargetLanguageCode) {
  return `sapling.demo.practice.${languageCode}.v1`;
}

function languageForConcept(conceptId: string): TargetLanguageCode {
  return conceptId.startsWith("demo-sv-") ? "sv" : "da";
}

type DemoEvent = {
  id: string;
  occurredAt: string;
  eventType:
    | "retrieval_attempt"
    | "listening_attempt"
    | "speaking_attempt"
    | "conversation_turn"
    | "error"
    | "repair";
  conceptId: string;
  payload: Record<string, unknown>;
};

function emptyPracticeSnapshot(): PracticeSnapshot {
  return {
    memories: [],
    continuity: [],
    recentScenarioIds: [],
    completedScenarioIds: [],
  };
}

function readPracticeSnapshot(languageCode: TargetLanguageCode) {
  try {
    const stored = window.localStorage.getItem(
      practiceStorageKey(languageCode),
    );
    return stored
      ? ({
          ...emptyPracticeSnapshot(),
          ...JSON.parse(stored),
        } as PracticeSnapshot)
      : emptyPracticeSnapshot();
  } catch {
    return emptyPracticeSnapshot();
  }
}

function writePracticeSnapshot(
  languageCode: TargetLanguageCode,
  snapshot: PracticeSnapshot,
) {
  try {
    window.localStorage.setItem(
      practiceStorageKey(languageCode),
      JSON.stringify(snapshot),
    );
  } catch {
    // Practice still works for the active tab when storage is restricted.
  }
  return snapshot;
}

function readStates(languageCode: TargetLanguageCode) {
  try {
    const stored = window.localStorage.getItem(stateStorageKey(languageCode));
    return stored
      ? (JSON.parse(stored) as LearnerConceptState[])
      : languageCode === "da"
        ? initialDemoStates.map((state) => ({ ...state }))
        : [];
  } catch {
    return languageCode === "da"
      ? initialDemoStates.map((state) => ({ ...state }))
      : [];
  }
}

function writeStates(
  languageCode: TargetLanguageCode,
  states: LearnerConceptState[],
) {
  try {
    window.localStorage.setItem(
      stateStorageKey(languageCode),
      JSON.stringify(states),
    );
  } catch {
    // The in-memory provider still updates in restricted browser contexts.
  }
}

function appendEvent(event: Omit<DemoEvent, "id" | "occurredAt">) {
  try {
    const languageCode = languageForConcept(event.conceptId);
    const stored = window.localStorage.getItem(eventStorageKey(languageCode));
    const events = stored ? (JSON.parse(stored) as DemoEvent[]) : [];
    events.push({
      ...event,
      id: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
    });
    window.localStorage.setItem(
      eventStorageKey(languageCode),
      JSON.stringify(events.slice(-500)),
    );
  } catch {
    // Event persistence is best-effort only in local demo mode.
  }
}

function replaceState(updated: LearnerConceptState) {
  const languageCode = languageForConcept(updated.conceptId);
  const states = readStates(languageCode);
  const index = states.findIndex(
    (state) => state.conceptId === updated.conceptId,
  );

  if (index === -1) {
    states.push(updated);
  } else {
    states[index] = updated;
  }

  writeStates(languageCode, states);
  return updated;
}

export function createDemoLearningRepository(): LearningRepository {
  return {
    mode: "local",
    async getTargetLanguage() {
      const stored = window.localStorage.getItem(targetLanguageStorageKey);
      return isTargetLanguageCode(stored) ? stored : "da";
    },
    async setTargetLanguage(languageCode: TargetLanguageCode) {
      window.localStorage.setItem(targetLanguageStorageKey, languageCode);
    },
    async loadSnapshot(languageCode: TargetLanguageCode) {
      return {
        concepts: (languageCode === "da"
          ? demoConcepts
          : swedishDemoConcepts
        ).map((concept) => ({ ...concept })),
        states: readStates(languageCode),
        mode: "local",
      };
    },
    async recordRetrievalAttempt(input: RetrievalAttemptInput) {
      const current =
        readStates(languageForConcept(input.conceptId)).find(
          (state) => state.conceptId === input.conceptId,
        ) ?? createEmptyState(input.conceptId);
      const updated = applyDemoRetrievalAttempt(current, input);

      appendEvent({
        eventType: "retrieval_attempt",
        conceptId: input.conceptId,
        payload: { ...input },
      });

      if (!input.successful) {
        appendEvent({
          eventType: "error",
          conceptId: input.conceptId,
          payload: {
            observedForm: input.responseText,
            targetForm: input.expectedResponse,
            category: "retrieval_mismatch",
          },
        });
      }

      return replaceState(updated);
    },
    async recordRepair(input: RepairInput) {
      const current =
        readStates(languageForConcept(input.conceptId)).find(
          (state) => state.conceptId === input.conceptId,
        ) ?? createEmptyState(input.conceptId);
      const updated = applyDemoRepair(current);

      appendEvent({
        eventType: "repair",
        conceptId: input.conceptId,
        payload: { ...input },
      });

      return replaceState(updated);
    },
    async recordListeningAttempt(input: ListeningAttemptInput) {
      const current =
        readStates(languageForConcept(input.conceptId)).find(
          (state) => state.conceptId === input.conceptId,
        ) ?? createEmptyState(input.conceptId);
      const updated = applyDemoListeningAttempt(current, input);

      appendEvent({
        eventType: "listening_attempt",
        conceptId: input.conceptId,
        payload: { ...input },
      });

      return replaceState(updated);
    },
    async recordSpeakingAttempt(input: SpeakingAttemptInput) {
      const current =
        readStates(languageForConcept(input.conceptId)).find(
          (state) => state.conceptId === input.conceptId,
        ) ?? createEmptyState(input.conceptId);
      const updated = applyDemoSpeakingAttempt(current, input);

      appendEvent({
        eventType: "speaking_attempt",
        conceptId: input.conceptId,
        payload: { ...input },
      });

      return replaceState(updated);
    },
    async loadPracticeSnapshot(languageCode: TargetLanguageCode) {
      return readPracticeSnapshot(languageCode);
    },
    async startPracticeSession() {
      return crypto.randomUUID();
    },
    async recordPracticeTurn(input) {
      const concepts =
        input.languageCode === "da" ? demoConcepts : swedishDemoConcepts;
      const conceptBySlug = new Map(
        concepts.map((concept) => [concept.slug, concept]),
      );
      const states = readStates(input.languageCode);
      const updatedStates: LearnerConceptState[] = [];

      for (const evidence of input.evidence) {
        const concept = conceptBySlug.get(evidence.conceptSlug);
        if (!concept) {
          continue;
        }
        const index = states.findIndex(
          (state) => state.conceptId === concept.id,
        );
        const current =
          index === -1 ? createEmptyState(concept.id) : states[index];
        const updated = applyDemoPracticeEvidence(
          current,
          evidence,
          input.speechMetrics,
        );
        if (index === -1) {
          states.push(updated);
        } else {
          states[index] = updated;
        }
        updatedStates.push(updated);
      }

      writeStates(input.languageCode, states);
      const primaryConcept = conceptBySlug.get(
        input.evidence[0]?.conceptSlug ?? "",
      );
      if (primaryConcept) {
        appendEvent({
          eventType: "conversation_turn",
          conceptId: primaryConcept.id,
          payload: { ...input, audioRetained: false },
        });
      }

      if (input.memories.length > 0) {
        const snapshot = readPracticeSnapshot(input.languageCode);
        const now = new Date().toISOString();
        const memories = [...snapshot.memories];
        for (const draft of input.memories) {
          const index = memories.findIndex(
            (memory) => memory.key === draft.key,
          );
          const memory: LearnerMemory = {
            ...draft,
            id: index === -1 ? crypto.randomUUID() : memories[index].id,
            languageCode: input.languageCode,
            lastConfirmedAt: now,
          };
          if (index === -1) {
            memories.push(memory);
          } else {
            memories[index] = memory;
          }
        }
        writePracticeSnapshot(input.languageCode, { ...snapshot, memories });
      }

      return updatedStates;
    },
    async completePracticeSession(input) {
      const snapshot = readPracticeSnapshot(input.languageCode);
      const continuity = [...snapshot.continuity];
      const index = continuity.findIndex(
        (item) => item.characterId === input.characterId,
      );
      const current = index === -1 ? null : continuity[index];
      const updated: CharacterContinuity = {
        characterId: input.characterId,
        languageCode: input.languageCode,
        encounterCount: (current?.encounterCount ?? 0) + 1,
        lastScenarioId: input.scenarioId,
        summary: input.summary,
        lastMetAt: new Date().toISOString(),
      };
      if (index === -1) {
        continuity.push(updated);
      } else {
        continuity[index] = updated;
      }
      return writePracticeSnapshot(input.languageCode, {
        ...snapshot,
        continuity,
        completedScenarioIds: [
          ...new Set([
            ...snapshot.completedScenarioIds,
            ...(input.goalProgress >= 1 &&
            input.turnCount >=
              (getPracticeScenario(input.languageCode, input.scenarioId)
                ?.minimumTurns ?? Infinity)
              ? [input.scenarioId]
              : []),
          ]),
        ],
        recentScenarioIds: [
          input.scenarioId,
          ...snapshot.recentScenarioIds.filter(
            (scenarioId) => scenarioId !== input.scenarioId,
          ),
        ].slice(0, 6),
      });
    },
    async deleteLearnerMemory(languageCode, memoryId) {
      const snapshot = readPracticeSnapshot(languageCode);
      return writePracticeSnapshot(languageCode, {
        ...snapshot,
        memories: snapshot.memories.filter((memory) => memory.id !== memoryId),
      });
    },
  };
}
