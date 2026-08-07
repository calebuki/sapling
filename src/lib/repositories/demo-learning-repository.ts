import { demoConcepts, initialDemoStates } from "@/lib/learning/demo-data";
import {
  applyDemoRepair,
  applyDemoRetrievalAttempt,
  createEmptyState,
} from "@/lib/learning/model";
import type { LearningRepository } from "@/lib/repositories/types";
import type {
  LearnerConceptState,
  RepairInput,
  RetrievalAttemptInput,
} from "@/types/learning";

const stateStorageKey = "sapling.demo.concept-states.v1";
const eventStorageKey = "sapling.demo.learning-events.v1";

type DemoEvent = {
  id: string;
  occurredAt: string;
  eventType: "retrieval_attempt" | "error" | "repair";
  conceptId: string;
  payload: Record<string, unknown>;
};

function readStates() {
  try {
    const stored = window.localStorage.getItem(stateStorageKey);
    return stored
      ? (JSON.parse(stored) as LearnerConceptState[])
      : initialDemoStates.map((state) => ({ ...state }));
  } catch {
    return initialDemoStates.map((state) => ({ ...state }));
  }
}

function writeStates(states: LearnerConceptState[]) {
  try {
    window.localStorage.setItem(stateStorageKey, JSON.stringify(states));
  } catch {
    // The in-memory provider still updates in restricted browser contexts.
  }
}

function appendEvent(event: Omit<DemoEvent, "id" | "occurredAt">) {
  try {
    const stored = window.localStorage.getItem(eventStorageKey);
    const events = stored ? (JSON.parse(stored) as DemoEvent[]) : [];
    events.push({
      ...event,
      id: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
    });
    window.localStorage.setItem(
      eventStorageKey,
      JSON.stringify(events.slice(-500)),
    );
  } catch {
    // Event persistence is best-effort only in local demo mode.
  }
}

function replaceState(updated: LearnerConceptState) {
  const states = readStates();
  const index = states.findIndex((state) => state.conceptId === updated.conceptId);

  if (index === -1) {
    states.push(updated);
  } else {
    states[index] = updated;
  }

  writeStates(states);
  return updated;
}

export function createDemoLearningRepository(): LearningRepository {
  return {
    mode: "local",
    async loadSnapshot() {
      return {
        concepts: demoConcepts.map((concept) => ({ ...concept })),
        states: readStates(),
        mode: "local",
      };
    },
    async recordRetrievalAttempt(input: RetrievalAttemptInput) {
      const current =
        readStates().find((state) => state.conceptId === input.conceptId) ??
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
        readStates().find((state) => state.conceptId === input.conceptId) ??
        createEmptyState(input.conceptId);
      const updated = applyDemoRepair(current);

      appendEvent({
        eventType: "repair",
        conceptId: input.conceptId,
        payload: { ...input },
      });

      return replaceState(updated);
    },
  };
}

