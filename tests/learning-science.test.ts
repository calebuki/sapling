import assert from "node:assert/strict";
import test from "node:test";

import {
  isDelayedIndependentSuccess,
  isIndependentEvidence,
  planAdaptiveReview,
  scheduleReview,
  scoreOpenResponse,
} from "../src/lib/learning/scheduler.ts";
import type { LearnerConceptState } from "../src/types/learning.ts";

const languageFixtures = [
  { languageCode: "da", target: "Kan du gentage det?" },
  { languageCode: "sv", target: "Kan du upprepa det?" },
] as const;

function state(
  conceptId: string,
  overrides: Partial<LearnerConceptState> = {},
): LearnerConceptState {
  return {
    conceptId,
    recognitionText: null,
    recognitionAudio: null,
    recall: null,
    production: null,
    pronunciation: null,
    automaticity: null,
    contextDiversity: null,
    speakerDiversity: null,
    retrievalLatencyMs: null,
    lastExposureAt: null,
    lastSuccessfulRetrievalAt: null,
    retrievalStrength: null,
    estimateConfidence: 0,
    exposureCount: 0,
    successfulRetrievalCount: 0,
    independentRetrievalCount: 0,
    delayedIndependentSuccessCount: 0,
    lastIndependentRetrievalAt: null,
    recallDueAt: null,
    listeningDueAt: null,
    pronunciationDueAt: null,
    recallIntervalHours: 0,
    listeningIntervalHours: 0,
    pronunciationIntervalHours: 0,
    recallLapses: 0,
    listeningLapses: 0,
    pronunciationLapses: 0,
    algorithmVersion: 2,
    ...overrides,
  };
}

test("bounded observations are scored by deterministic versioned rules", () => {
  assert.deepEqual(scoreOpenResponse({
    meaningScore: 0.8,
    grammarScore: 0.6,
    vocabularyScore: 0.7,
  }), {
    successful: true,
    score: 0.755,
    scorerVersion: "deterministic-scorer-v2",
  });
  assert.equal(scoreOpenResponse({
    meaningScore: 0.67,
    grammarScore: 1,
    vocabularyScore: 1,
  }).successful, false);
});

for (const fixture of languageFixtures) {
  test(`${fixture.languageCode}: hints and visible answers stay assisted`, () => {
    assert.equal(isIndependentEvidence({
      evidenceKind: "independent_recall",
      answerVisible: false,
      hintCount: 0,
    }), true, fixture.target);
    assert.equal(isIndependentEvidence({
      evidenceKind: "independent_recall",
      answerVisible: false,
      hintCount: 1,
    }), false, fixture.target);
    assert.equal(isIndependentEvidence({
      evidenceKind: "independent_recall",
      answerVisible: true,
      hintCount: 0,
    }), false, fixture.target);
  });

  test(`${fixture.languageCode}: progression needs delayed independent evidence`, () => {
    const now = new Date("2026-08-31T18:00:00.000Z");
    assert.equal(isDelayedIndependentSuccess({
      evidenceKind: "independent_recall",
      answerVisible: false,
      hintCount: 0,
      previousIndependentAt: "2026-08-31T10:00:00.000Z",
      successful: true,
      now,
    }), true, fixture.target);
    assert.equal(isDelayedIndependentSuccess({
      evidenceKind: "assisted_recall",
      answerVisible: false,
      hintCount: 1,
      previousIndependentAt: "2026-08-30T10:00:00.000Z",
      successful: true,
      now,
    }), false, fixture.target);
  });
}

test("scheduler expands independent successes and quickly requeues lapses", () => {
  const now = new Date("2026-08-31T18:00:00.000Z");
  const success = scheduleReview({
    assisted: false,
    elapsedHours: 24,
    intervalHours: 12,
    lapses: 0,
    now,
    successful: true,
  });
  const failure = scheduleReview({
    assisted: false,
    elapsedHours: 24,
    intervalHours: 12,
    lapses: 0,
    now,
    successful: false,
  });

  assert.ok(success.intervalHours > 12);
  assert.equal(failure.lapses, 1);
  assert.equal(failure.dueAt, "2026-08-31T18:10:00.000Z");
});

test("adaptive planning prioritizes overdue weak listening separately", () => {
  const now = new Date("2026-08-31T18:00:00.000Z");
  const planned = planAdaptiveReview([
    {
      id: "da-recall",
      dimension: "recall",
      sortOrder: 1,
      state: state("da", { recall: 0.8, recallDueAt: "2026-09-01T18:00:00.000Z" }),
      value: "recall",
    },
    {
      id: "sv-listening",
      dimension: "recognitionAudio",
      sortOrder: 2,
      state: state("sv", { recognitionAudio: 0.2, listeningDueAt: "2026-08-30T18:00:00.000Z" }),
      value: "listening",
    },
  ], { limit: 1, now });

  assert.deepEqual(planned, ["listening"]);
});
