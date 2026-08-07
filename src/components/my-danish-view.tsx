"use client";

import { Activity, AudioLines, Info, TimerReset } from "lucide-react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import {
  createEmptyState,
  deriveGrowthStage,
  dimensionLabels,
  growthStageLabels,
  learningDimensions,
} from "@/lib/learning/model";
import type { ConceptKind, GrowthStage } from "@/types/learning";

const stageOrder: GrowthStage[] = [
  "seed",
  "sprout",
  "growing",
  "established",
  "automatic",
];

const stageStyles: Record<GrowthStage, string> = {
  seed: "bg-amber-400/15 text-amber-500",
  sprout: "bg-moss-300/20 text-forest-700",
  growing: "bg-moss-400/20 text-forest-800",
  established: "bg-forest-700/12 text-forest-800",
  automatic: "bg-forest-900 text-cream-50",
};

const kindLabels: Record<ConceptKind, string> = {
  word: "Word",
  chunk: "Chunk",
  construction: "Construction",
  collocation: "Collocation",
  phoneme: "Phoneme",
  phonetic_contrast: "Sound contrast",
  communicative_function: "Function",
  pragmatic_convention: "Pragmatics",
  listening_phenomenon: "Listening",
};

export function MyDanishView() {
  const { concepts, states, mode, isLoading, error } = useLearningModel();
  const stateByConcept = new Map(
    states.map((state) => [state.conceptId, state]),
  );
  const modeled = concepts.map((concept) => {
    const state = stateByConcept.get(concept.id) ?? createEmptyState(concept.id);
    return { concept, state, stage: deriveGrowthStage(state) };
  });
  const audioGapCount = modeled.filter(({ state }) => {
    if (state.recognitionText === null || state.recognitionAudio === null) {
      return false;
    }
    return state.recognitionText - state.recognitionAudio >= 0.18;
  }).length;
  const observedCount = modeled.filter(
    ({ state }) => state.exposureCount > 0,
  ).length;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="paper-panel h-64 animate-pulse rounded-[26px]"
            key={item}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="paper-panel rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-700/55">
              Growth map · Danish
            </p>
            <h2 className="mt-2 font-display text-3xl text-forest-950 sm:text-4xl">
              {observedCount} concepts have evidence so far.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-forest-900/58">
              A growth label is only a summary. The dimensions below stay
              separate so reading cannot hide a listening weakness, and exposure
              cannot masquerade as retrieval.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/55 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-forest-700/45">
                Audio gaps
              </p>
              <p className="mt-1 font-display text-2xl text-forest-950">
                {audioGapCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white/55 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-forest-700/45">
                Source
              </p>
              <p className="mt-1 text-sm font-bold capitalize text-forest-950">
                {mode}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-5 gap-1.5">
          {stageOrder.map((stage) => {
            const count = modeled.filter((item) => item.stage === stage).length;
            return (
              <div className="min-w-0" key={stage}>
                <div
                  className={`h-2 rounded-full ${
                    count > 0 ? "bg-moss-500" : "bg-forest-900/8"
                  }`}
                />
                <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-forest-800/50">
                  {growthStageLabels[stage]}
                </p>
                <p className="font-display text-xl text-forest-950">{count}</p>
              </div>
            );
          })}
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl bg-clay-400/10 p-4 text-sm text-forest-900">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {modeled.map(({ concept, state, stage }) => (
          <article
            className="paper-panel rounded-[26px] p-5 sm:p-6"
            key={concept.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-forest-700/48">
                  {kindLabels[concept.kind]}
                </p>
                <h3 className="mt-1 font-display text-3xl leading-tight text-forest-950">
                  {concept.canonicalForm}
                </h3>
                <p className="mt-1 text-sm text-forest-900/55">{concept.gloss}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${stageStyles[stage]}`}
              >
                {growthStageLabels[stage]}
              </span>
            </div>

            <div className="mt-6 grid gap-x-5 gap-y-3 sm:grid-cols-2">
              {learningDimensions.map((dimension) => {
                const value = state[dimension];
                return (
                  <div key={dimension}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-forest-900/58">
                        {dimensionLabels[dimension]}
                      </span>
                      <span className="tabular-nums text-forest-900/40">
                        {value === null ? "—" : `${Math.round(value * 100)}`}
                      </span>
                    </div>
                    <div className="dimension-track">
                      {value !== null ? (
                        <div
                          className="dimension-fill"
                          style={{ width: `${Math.max(3, value * 100)}%` }}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-forest-900/8 border-t border-forest-900/8 pt-4 text-center">
              <div className="px-2">
                <Activity className="mx-auto text-forest-700/45" size={15} />
                <p className="mt-1 text-sm font-bold text-forest-950">
                  {state.exposureCount}
                </p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-forest-700/42">
                  evidence
                </p>
              </div>
              <div className="px-2">
                <TimerReset className="mx-auto text-forest-700/45" size={15} />
                <p className="mt-1 text-sm font-bold text-forest-950">
                  {state.retrievalLatencyMs === null
                    ? "—"
                    : `${(state.retrievalLatencyMs / 1000).toFixed(1)}s`}
                </p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-forest-700/42">
                  retrieval
                </p>
              </div>
              <div className="px-2">
                <AudioLines className="mx-auto text-forest-700/45" size={15} />
                <p className="mt-1 text-sm font-bold text-forest-950">
                  {state.speakerDiversity === null
                    ? "—"
                    : Math.round(state.speakerDiversity * 100)}
                </p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-forest-700/42">
                  speakers
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="flex items-start gap-2 px-2 text-xs leading-5 text-forest-900/45">
        <Info className="mt-0.5 shrink-0" size={14} />
        Numbers are model estimates from 0–100, not grades. A dash means Sapling
        does not yet have evidence for that dimension.
      </p>
    </div>
  );
}

