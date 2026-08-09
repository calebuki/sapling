import { demoConcepts, initialDemoStates } from "@/lib/learning/demo-data";
import { swedishDemoConcepts } from "@/lib/learning/swedish-demo-data";
import {
  isTargetLanguageCode,
  type TargetLanguageCode,
} from "@/lib/learning/languages";
import {
  applyDemoRepair,
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
    | "error"
    | "repair";
  conceptId: string;
  payload: Record<string, unknown>;
};

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
  const index = states.findIndex((state) => state.conceptId === updated.conceptId);

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
        concepts: (languageCode === "da" ? demoConcepts : swedishDemoConcepts).map(
          (concept) => ({ ...concept }),
        ),
        states: readStates(languageCode),
        mode: "local",
      };
    },
    async recordRetrievalAttempt(input: RetrievalAttemptInput) {
      const current =
        readStates(languageForConcept(input.conceptId)).find(
          (state) => state.conceptId === input.conceptId,
        ) ??
        createEmptyState(input.conceptId);
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
        ) ??
        createEmptyState(input.conceptId);
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
        ) ??
        createEmptyState(input.conceptId);
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
        ) ??
        createEmptyState(input.conceptId);
      const updated = applyDemoSpeakingAttempt(current, input);

      appendEvent({
        eventType: "speaking_attempt",
        conceptId: input.conceptId,
        payload: { ...input },
      });

      return replaceState(updated);
    },
  };
}
