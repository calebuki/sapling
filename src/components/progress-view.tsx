"use client";

import {
  Activity,
  BookOpenText,
  ChevronDown,
  CircleAlert,
  Ear,
  Leaf,
  Mic,
  Sprout,
  TreePine,
} from "lucide-react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import {
  createEmptyState,
  deriveGrowthStage,
  dimensionLabels,
  growthStageLabels,
  learningDimensions,
} from "@/lib/learning/model";
import type {
  Concept,
  ConceptKind,
  GrowthStage,
  LearnerConceptState,
} from "@/types/learning";

const growthPath: Array<{
  stage: GrowthStage;
  percent: number;
  Icon: typeof Sprout;
}> = [
  { stage: "seed", percent: 0, Icon: Leaf },
  { stage: "sprout", percent: 10, Icon: Sprout },
  { stage: "growing", percent: 25, Icon: Sprout },
  { stage: "established", percent: 50, Icon: TreePine },
  { stage: "automatic", percent: 75, Icon: TreePine },
];

const nearFluencyTarget = 10_000;
const maxPointsPerConcept = 10;

const stageStyles: Record<GrowthStage, string> = {
  seed: "bg-amber-400/15 text-amber-500",
  sprout: "bg-moss-300/20 text-forest-700",
  growing: "bg-moss-400/20 text-forest-800",
  established: "bg-forest-700/12 text-forest-800",
  automatic: "bg-forest-900 text-cream-50",
};

const kindLabels: Record<ConceptKind, string> = {
  word: "Word",
  chunk: "Phrase",
  construction: "Pattern",
  collocation: "Word pair",
  phoneme: "Sound",
  phonetic_contrast: "Sound contrast",
  communicative_function: "Conversation skill",
  pragmatic_convention: "Conversation habit",
  listening_phenomenon: "Language sound",
};

type ModeledConcept = {
  concept: Concept;
  state: LearnerConceptState;
  stage: GrowthStage;
};

function nextAction(state: LearnerConceptState) {
  if (state.recognitionText === null || state.recognitionText < 0.45) {
    return { Icon: BookOpenText, label: "Read this next" };
  }

  const strongestText = Math.max(state.recognitionText ?? 0, state.recall ?? 0);

  if (
    state.recognitionAudio === null ||
    strongestText - state.recognitionAudio >= 0.16
  ) {
    return { Icon: Ear, label: "Listen next" };
  }

  if (state.pronunciation === null || state.pronunciation < 0.5) {
    return { Icon: Mic, label: "Practice saying this" };
  }

  if ((state.recall ?? 0) < 0.58) {
    return { Icon: Activity, label: "Recall without a prompt" };
  }

  return { Icon: Sprout, label: "Use it in a new situation" };
}

function currentGrowthStage(progress: number) {
  return (
    [...growthPath].reverse().find((step) => progress >= step.percent) ??
    growthPath[0]
  );
}

export function ProgressView() {
  const { concepts, states, isLoading, error, targetLanguage } = useLearningModel();
  const stateByConcept = new Map(
    states.map((state) => [state.conceptId, state]),
  );
  const modeled: ModeledConcept[] = concepts.map((concept) => {
    const state = stateByConcept.get(concept.id) ?? createEmptyState(concept.id);
    return { concept, state, stage: deriveGrowthStage(state) };
  });
  const practiced = modeled.filter(({ state }) => state.exposureCount > 0);
  const newConcepts = modeled.filter(({ state }) => state.exposureCount === 0);
  const growthPoints = practiced.reduce(
    (total, { state }) =>
      total +
      Math.min(
        maxPointsPerConcept,
        state.exposureCount + state.successfulRetrievalCount * 2,
      ),
    0,
  );
  const journeyProgress = Math.min(
    100,
    (growthPoints / nearFluencyTarget) * 100,
  );
  const displayedProgress =
    practiced.length > 0 ? Math.max(1, Math.round(journeyProgress)) : 0;
  const overallStage = currentGrowthStage(displayedProgress);

  const needsAttention = practiced.filter(({ state, stage }) => {
    const audioGap =
      state.recognitionText !== null &&
      state.recognitionAudio !== null &&
      state.recognitionText - state.recognitionAudio >= 0.16;
    return stage === "seed" || stage === "sprout" || audioGap;
  });
  const attentionIds = new Set(needsAttention.map(({ concept }) => concept.id));
  const strong = practiced.filter(
    ({ concept, stage }) =>
      !attentionIds.has(concept.id) &&
      (stage === "established" || stage === "automatic"),
  );
  const strongIds = new Set(strong.map(({ concept }) => concept.id));
  const growing = practiced.filter(
    ({ concept }) =>
      !attentionIds.has(concept.id) && !strongIds.has(concept.id),
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="paper-panel h-72 animate-pulse rounded-[28px]" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="paper-panel h-48 animate-pulse rounded-[26px]"
              key={item}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="paper-panel overflow-hidden rounded-[24px] p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-forest-700/58">Current stage</p>
            <h2 className="mt-2 font-display text-3xl text-forest-950 sm:text-4xl">
              {growthStageLabels[overallStage.stage]}
            </h2>
            <p className="mt-2 text-sm font-semibold text-forest-900/58">
              {practiced.length} ideas practiced
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:min-w-64">
            <div className="rounded-[15px] bg-moss-300/22 p-4">
              <p className="text-2xl font-extrabold tracking-[-0.04em] text-forest-950">{needsAttention.length}</p>
              <p className="mt-1 text-xs font-bold text-forest-900/58">Need attention</p>
            </div>
            <div className="rounded-[15px] bg-forest-950 p-4 text-cream-50">
              <p className="text-2xl font-extrabold tracking-[-0.04em]">{growing.length + strong.length}</p>
              <p className="mt-1 text-xs font-bold text-cream-100/68">Taking shape</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-xs font-bold text-forest-900/58">
            <span>Long-term progress</span>
            <span>{displayedProgress}%</span>
          </div>
          <div
            aria-label={`Progress toward near-fluent ${targetLanguage.name}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={displayedProgress}
            className="mt-2 h-3 overflow-hidden rounded-full bg-forest-900/8"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-moss-400 to-forest-700 transition-[width] duration-500"
              style={{ width: `${displayedProgress}%` }}
            />
          </div>
        </div>

        <ol className="mt-8 grid grid-cols-5 gap-2">
          {growthPath.map(({ stage, percent, Icon }, index) => {
            const reached = displayedProgress >= percent;
            const active = stage === overallStage.stage;
            return (
              <li className="min-w-0 text-center" key={stage}>
                <span
                  className={`mx-auto grid size-9 place-items-center rounded-full transition sm:size-11 ${
                    active
                      ? "bg-forest-900 text-cream-50 shadow-lg shadow-forest-900/15"
                      : reached
                        ? "bg-moss-400/22 text-forest-800"
                        : "bg-forest-900/6 text-forest-900/28"
                  }`}
                >
                  <Icon aria-hidden="true" size={index >= 3 ? 19 : 17} />
                </span>
                <p
                  className={`mt-2 truncate text-[9px] font-bold uppercase tracking-[0.08em] sm:text-[10px] ${
                    active ? "text-forest-950" : "text-forest-800/45"
                  }`}
                >
                  {growthStageLabels[stage]}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {error ? (
        <p className="flex items-start gap-2 rounded-2xl bg-clay-400/10 p-4 text-sm text-forest-900">
          <CircleAlert className="mt-0.5 shrink-0 text-clay-400" size={16} />
          {error}
        </p>
      ) : null}

      {practiced.length === 0 ? (
        <section className="paper-panel rounded-[28px] p-7 sm:p-9">
          <Sprout className="text-moss-500" size={28} />
          <h2 className="mt-5 font-display text-3xl text-forest-950">
            Your first seed is ready.
          </h2>
          <p className="mt-2 text-sm leading-6 text-forest-900/55">
            Finish one learning prompt, text exercise, or Listen &amp; Speak
            sentence and your progress will appear here.
          </p>
        </section>
      ) : null}

      <ProgressGroup
        items={needsAttention}
        languageName={targetLanguage.name}
        title="Needs attention"
      />
      <ProgressGroup
        collapsed
        items={growing}
        languageName={targetLanguage.name}
        title="Growing"
      />
      <ProgressGroup
        collapsed
        items={strong}
        languageName={targetLanguage.name}
        title="Strong"
      />

      {newConcepts.length > 0 ? (
        <details className="paper-panel group rounded-[24px] p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <p className="text-sm font-bold text-forest-950">
              Coming up · {newConcepts.length} new ideas
            </p>
            <ChevronDown
              className="text-forest-900/40 transition group-open:rotate-180"
              size={18}
            />
          </summary>
          <div className="mt-5 grid gap-2 border-t border-forest-900/8 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {newConcepts.map(({ concept }) => (
              <div className="rounded-2xl bg-white/45 p-3" key={concept.id}>
                <p className="font-semibold text-forest-950">
                  {concept.canonicalForm}
                </p>
                <p className="mt-0.5 text-xs text-forest-900/48">{concept.gloss}</p>
              </div>
            ))}
          </div>
        </details>
      ) : null}

    </div>
  );
}

function ProgressGroup({
  collapsed = false,
  languageName,
  title,
  items,
}: {
  collapsed?: boolean;
  languageName: string;
  title: string;
  items: ModeledConcept[];
}) {
  if (items.length === 0) {
    return null;
  }

  const cards = (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <ConceptCard item={item} key={item.concept.id} languageName={languageName} />
      ))}
    </div>
  );

  if (collapsed) {
    return (
      <details className="paper-panel group rounded-[20px] p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.035em] text-forest-950">{title}</h2>
            <p className="mt-1 text-xs font-semibold text-forest-900/52">{items.length} ideas</p>
          </div>
          <ChevronDown aria-hidden="true" className="text-forest-900/48 transition group-open:rotate-180" size={19} />
        </summary>
        <div className="mt-5 border-t border-forest-900/8 pt-5">{cards}</div>
      </details>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
        <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-forest-950">{title}</h2>
        <span className="rounded-full bg-white/55 px-3 py-1 text-xs font-bold text-forest-900/50">
          {items.length}
        </span>
      </div>
      {cards}
    </section>
  );
}

function ConceptCard({
  item,
  languageName,
}: {
  item: ModeledConcept;
  languageName: string;
}) {
  const { concept, state, stage } = item;
  const action = nextAction(state);
  const ActionIcon = action.Icon;

  return (
    <article className="paper-panel rounded-[20px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-forest-700/48">
            {concept.kind === "listening_phenomenon"
              ? `${languageName} sound`
              : kindLabels[concept.kind]}
          </p>
          <h3 className="mt-1 text-2xl font-extrabold leading-tight tracking-[-0.035em] text-forest-950">
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

      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-moss-400/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/60 text-forest-800">
            <ActionIcon aria-hidden="true" size={17} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-forest-700/45">
              Best next step
            </p>
            <p className="mt-0.5 text-sm font-bold text-forest-950">
              {action.label}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold tabular-nums text-forest-900/42">
          {state.exposureCount} {state.exposureCount === 1 ? "practice" : "practices"}
        </span>
      </div>

      <details className="group mt-4 border-t border-forest-900/8 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-forest-900/52">
          See learning evidence
          <ChevronDown
            className="transition group-open:rotate-180"
            aria-hidden="true"
            size={16}
          />
        </summary>
        <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {learningDimensions.map((dimension) => {
            const value = state[dimension];
            return (
              <div key={dimension}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-forest-900/58">
                    {dimensionLabels[dimension]}
                  </span>
                  <span className="tabular-nums text-forest-900/40">
                    {value === null ? "—" : Math.round(value * 100)}
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
      </details>
    </article>
  );
}
