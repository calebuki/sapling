"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleHelp,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { useLearningModel } from "@/components/providers/learning-model-provider";

const exercises = [
  {
    id: "cafe-request",
    conceptSlug: "jeg-vil-gerne",
    eyebrow: "Cold recall · café",
    prompt: "You’re ordering with Emil. Say: “I would like a coffee, please.”",
    expected: "Jeg vil gerne have en kaffe, tak.",
    note: "The chunk carries the polite intention; tak softens the exchange naturally.",
  },
  {
    id: "maybe-later",
    conceptSlug: "maaske",
    eyebrow: "Quick retrieval · uncertainty",
    prompt: "Emil asks if you’ll go tonight. Give the one-word Danish answer: “Maybe.”",
    expected: "Måske.",
    note: "Short, useful, and worth making fast enough to arrive without translation.",
  },
  {
    id: "train-transfer",
    conceptSlug: "skal-vi-infinitive",
    eyebrow: "Transfer · a new context",
    prompt: "Invite Emil to take the train: “Shall we take the train?”",
    expected: "Skal vi tage toget?",
    note: "The frame skal vi + infinitiv transfers from one shared proposal to another.",
  },
];

type Phase = "attempt" | "compare" | "reveal" | "repair" | "complete";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("da")
    .replace(/[.,!?…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function LearnSession() {
  const {
    concepts,
    isLoading,
    error: modelError,
    recordRetrievalAttempt,
    recordRepair,
  } = useLearningModel();
  const [itemIndex, setItemIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("attempt");
  const [response, setResponse] = useState("");
  const [submittedResponse, setSubmittedResponse] = useState("");
  const [repairResponse, setRepairResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const attemptLatencyMs = useRef(0);

  const exercise = exercises[itemIndex];
  const concept = concepts.find(
    (candidate) => candidate.slug === exercise?.conceptSlug,
  );

  function moveForward() {
    if (itemIndex === exercises.length - 1) {
      setPhase("complete");
      return;
    }
    setItemIndex((current) => current + 1);
    setPhase("attempt");
    setResponse("");
    setSubmittedResponse("");
    setRepairResponse("");
    startedAt.current = null;
    attemptLatencyMs.current = 0;
  }

  function revealAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!response.trim()) {
      return;
    }
    attemptLatencyMs.current = Math.max(
      0,
      Math.round(event.timeStamp - (startedAt.current ?? event.timeStamp)),
    );
    setSubmittedResponse(response.trim());
    setPhase("compare");
  }

  async function markNotSure(event: React.MouseEvent<HTMLButtonElement>) {
    if (!concept || !exercise) {
      return;
    }

    attemptLatencyMs.current = Math.max(
      0,
      Math.round(event.timeStamp - (startedAt.current ?? event.timeStamp)),
    );
    setIsSaving(true);
    setActionError(null);
    try {
      await recordRetrievalAttempt({
        conceptId: concept.id,
        responseText: "",
        expectedResponse: exercise.expected,
        successful: false,
        latencyMs: attemptLatencyMs.current,
        context: {
          exerciseId: exercise.id,
          activityType: exercise.eyebrow,
          responseMode: "not-sure",
          source: "initial-learn-session",
        },
      });
      setPhase("reveal");
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "This attempt could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function assessAttempt(successful: boolean) {
    if (!concept || !exercise) {
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      await recordRetrievalAttempt({
        conceptId: concept.id,
        responseText: submittedResponse,
        expectedResponse: exercise.expected,
        successful,
        latencyMs: attemptLatencyMs.current,
        context: {
          exerciseId: exercise.id,
          activityType: exercise.eyebrow,
          source: "initial-learn-session",
        },
      });

      if (successful) {
        moveForward();
      } else {
        setPhase("repair");
      }
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "This attempt could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitRepair(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!concept || !exercise || !repairResponse.trim()) {
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      await recordRepair({
        conceptId: concept.id,
        responseText: repairResponse.trim(),
        targetText: exercise.expected,
        context: {
          exerciseId: exercise.id,
          source: "initial-learn-session",
        },
      });
      moveForward();
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "This repair could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function restart() {
    setItemIndex(0);
    setPhase("attempt");
    setResponse("");
    setSubmittedResponse("");
    setRepairResponse("");
    setActionError(null);
    startedAt.current = null;
    attemptLatencyMs.current = 0;
  }

  if (isLoading) {
    return (
      <div className="paper-panel grid min-h-[430px] animate-pulse place-items-center rounded-[30px] p-8 text-sm text-forest-900/50">
        Preparing today’s retrieval…
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="paper-panel soft-enter rounded-[30px] p-7 sm:p-10">
        <div className="grid size-14 place-items-center rounded-2xl bg-moss-400/20 text-forest-800">
          <Sparkles aria-hidden="true" size={25} />
        </div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-forest-700/55">
          Session complete
        </p>
        <h2 className="mt-2 max-w-xl font-display text-4xl leading-[1.06] text-forest-950 sm:text-5xl">
          Three answers practiced.
        </h2>
        <button
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
          onClick={restart}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={17} />
          Practice again
        </button>
      </div>
    );
  }

  if (!exercise || !concept) {
    return (
      <div className="paper-panel rounded-[30px] p-8">
        <CircleAlert className="text-clay-400" size={24} />
        <h2 className="mt-4 font-display text-3xl">The concept catalog is empty.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-forest-900/60">
          Apply Sapling’s initial migration to its Supabase project, or remove the
          Supabase variables to use the local foundation data.
        </p>
      </div>
    );
  }

  const progress = ((itemIndex + (phase === "attempt" ? 0 : 0.45)) / exercises.length) * 100;
  const exactTextMatch =
    normalize(submittedResponse) === normalize(exercise.expected);

  return (
    <div className="paper-panel soft-enter overflow-hidden rounded-[30px]">
      <div className="border-b border-forest-900/8 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.16em] text-forest-700/55">
          <span className="ml-auto">
            {itemIndex + 1} of {exercises.length}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
          <div
            className="h-full rounded-full bg-moss-500 transition-[width] duration-500"
            style={{ width: `${Math.max(4, progress)}%` }}
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-moss-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-forest-800">
            {exercise.eyebrow}
          </span>
          <span className="rounded-full border border-forest-900/10 px-3 py-1 text-[11px] font-semibold text-forest-800/55">
            {concept.kind.replaceAll("_", " ")}
          </span>
        </div>

        {phase === "attempt" ? (
          <form className="mt-8" onSubmit={revealAnswer}>
            <h2 className="max-w-3xl font-display text-3xl leading-tight text-forest-950 sm:text-4xl lg:text-[44px]">
              {exercise.prompt}
            </h2>
            <label className="mt-8 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-forest-700/60">
                Your Danish
              </span>
              <textarea
                autoFocus
                className="mt-3 min-h-32 w-full resize-none rounded-[22px] border border-forest-900/12 bg-white/70 p-5 text-xl text-forest-950 outline-none transition placeholder:text-forest-900/25 focus:border-moss-500 focus:ring-4 focus:ring-moss-400/15"
                onChange={(event) => {
                  startedAt.current ??= event.timeStamp;
                  setResponse(event.target.value);
                }}
                onFocus={(event) => {
                  startedAt.current ??= event.timeStamp;
                }}
                placeholder="Skriv på dansk…"
                value={response}
              />
            </label>
            <div className="mt-5 grid gap-3 sm:flex">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3.5 text-sm font-bold text-forest-900 transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                disabled={isSaving}
                onClick={markNotSure}
                type="button"
              >
                <CircleHelp aria-hidden="true" size={17} />
                Not sure
              </button>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                disabled={!response.trim() || isSaving}
                type="submit"
              >
                Check answer
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            </div>
          </form>
        ) : null}

        {phase === "reveal" ? (
          <div className="mt-8 soft-enter">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-forest-700/55">
              A natural answer
            </p>
            <h2 className="mt-3 rounded-[22px] border border-moss-500/20 bg-moss-400/10 p-5 font-display text-3xl leading-tight text-forest-950 sm:text-4xl">
              {exercise.expected}
            </h2>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-forest-900/[0.045] p-4 text-sm leading-6 text-forest-900/62">
              <Sparkles className="mt-0.5 shrink-0 text-moss-500" size={17} />
              <span>{exercise.note}</span>
            </div>
            <button
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800 sm:w-auto"
              onClick={moveForward}
              type="button"
            >
              Continue
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          </div>
        ) : null}

        {phase === "compare" ? (
          <div className="mt-8 soft-enter">
            <h2 className="font-display text-3xl text-forest-950 sm:text-4xl">
              Compare your answer.
            </h2>
            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[22px] border border-forest-900/10 bg-white/55 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/50">
                  You wrote
                </p>
                <p className="mt-3 text-lg leading-7 text-forest-950">
                  {submittedResponse}
                </p>
              </div>
              <div className="rounded-[22px] border border-moss-500/20 bg-moss-400/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/55">
                  A natural answer
                </p>
                <p className="mt-3 text-lg font-semibold leading-7 text-forest-950">
                  {exercise.expected}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-forest-900/[0.045] p-4 text-sm leading-6 text-forest-900/62">
              <Sparkles className="mt-0.5 shrink-0 text-moss-500" size={17} />
              <span>
                {exercise.note} {exactTextMatch ? "The text also matches exactly." : "Judge the idea, not only punctuation."}
              </span>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3.5 text-sm font-bold text-forest-900 transition hover:bg-white disabled:opacity-50"
                disabled={isSaving}
                onClick={() => assessAttempt(false)}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={17} />
                Needs practice
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800 disabled:opacity-50"
                disabled={isSaving}
                onClick={() => assessAttempt(true)}
                type="button"
              >
                <Check aria-hidden="true" size={17} />
                Got it
              </button>
            </div>
          </div>
        ) : null}

        {phase === "repair" ? (
          <form className="mt-8 soft-enter" onSubmit={submitRepair}>
            <h2 className="font-display text-3xl text-forest-950 sm:text-4xl">
              Type it once more.
            </h2>
            <p className="mt-4 rounded-2xl bg-moss-400/12 p-4 text-lg font-semibold text-forest-950">
              {exercise.expected}
            </p>
            <label className="mt-6 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-forest-700/60">
                Your answer
              </span>
              <input
                autoFocus
                className="mt-3 w-full rounded-[20px] border border-forest-900/12 bg-white/70 px-5 py-4 text-lg text-forest-950 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-400/15"
                onChange={(event) => setRepairResponse(event.target.value)}
                value={repairResponse}
              />
            </label>
            <button
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:opacity-40 sm:w-auto"
              disabled={!repairResponse.trim() || isSaving}
              type="submit"
            >
              Continue
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          </form>
        ) : null}

        {actionError || modelError ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-clay-400/10 p-3 text-sm text-forest-900">
            <CircleAlert className="mt-0.5 shrink-0 text-clay-400" size={16} />
            {actionError ?? modelError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
