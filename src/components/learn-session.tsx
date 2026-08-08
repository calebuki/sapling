"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleHelp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DanishAudioButton } from "@/components/danish-audio-button";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { lessons } from "@/lib/learning/course";

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
    states,
    isLoading,
    error: modelError,
    recordRetrievalAttempt,
    recordRepair,
  } = useLearningModel();
  const [lessonIndex, setLessonIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("attempt");
  const [response, setResponse] = useState("");
  const [submittedResponse, setSubmittedResponse] = useState("");
  const [repairResponse, setRepairResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const didChooseStartingLesson = useRef(false);
  const startedAt = useRef<number | null>(null);
  const attemptLatencyMs = useRef(0);

  const stateByConcept = new Map(
    states.map((state) => [state.conceptId, state]),
  );
  const conceptBySlug = new Map(concepts.map((concept) => [concept.slug, concept]));
  const completedLessons = lessons.map((lesson) =>
    lesson.exercises.every((exercise) => {
      const concept = conceptBySlug.get(exercise.conceptSlug);
      return concept
        ? (stateByConcept.get(concept.id)?.exposureCount ?? 0) > 0
        : false;
    }),
  );

  useEffect(() => {
    if (isLoading || didChooseStartingLesson.current) {
      return;
    }

    const firstIncomplete = completedLessons.findIndex((complete) => !complete);
    setLessonIndex(firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete);
    didChooseStartingLesson.current = true;
  }, [completedLessons, isLoading]);

  const lesson = lessons[lessonIndex];
  const exercise = lesson?.exercises[itemIndex];
  const concept = exercise ? conceptBySlug.get(exercise.conceptSlug) : undefined;

  function resetExercise() {
    setItemIndex(0);
    setPhase("attempt");
    setResponse("");
    setSubmittedResponse("");
    setRepairResponse("");
    setActionError(null);
    startedAt.current = null;
    attemptLatencyMs.current = 0;
  }

  function chooseLesson(index: number) {
    setLessonIndex(index);
    resetExercise();
  }

  function moveForward() {
    if (!lesson || itemIndex === lesson.exercises.length - 1) {
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
    if (!concept || !exercise || !lesson) {
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
          lessonId: lesson.id,
          exerciseId: exercise.audioId,
          activityType: exercise.eyebrow,
          responseMode: "not-sure",
          source: "lesson-course",
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
    if (!concept || !exercise || !lesson) {
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
          lessonId: lesson.id,
          exerciseId: exercise.audioId,
          activityType: exercise.eyebrow,
          source: "lesson-course",
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
    if (!concept || !exercise || !lesson || !repairResponse.trim()) {
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
          lessonId: lesson.id,
          exerciseId: exercise.audioId,
          source: "lesson-course",
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

  if (isLoading) {
    return (
      <div className="paper-panel grid min-h-[430px] animate-pulse place-items-center rounded-[30px] p-8 text-sm text-forest-900/50">
        Preparing your next lesson…
      </div>
    );
  }

  if (phase === "complete" && lesson) {
    const hasNextLesson = lessonIndex < lessons.length - 1;
    return (
      <div className="space-y-5">
        <LessonRail
          completedLessons={completedLessons}
          lessonIndex={lessonIndex}
          onChoose={chooseLesson}
        />
        <div className="paper-panel soft-enter rounded-[30px] p-7 sm:p-10">
          <div className="grid size-14 place-items-center rounded-2xl bg-moss-400/20 text-forest-800">
            <Sparkles aria-hidden="true" size={25} />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-forest-700/55">
            Lesson {lesson.number} complete
          </p>
          <h2 className="mt-2 max-w-xl font-display text-4xl leading-[1.06] text-forest-950 sm:text-5xl">
            {lesson.title} has taken root.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-forest-900/60">
            You practiced all three ideas. Hearing and saying them in Listen &amp;
            Speak will strengthen a different part of your Danish.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {hasNextLesson ? (
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
                onClick={() => chooseLesson(lessonIndex + 1)}
                type="button"
              >
                Start lesson {lesson.number + 1}
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3 text-sm font-bold text-forest-900 transition hover:bg-white"
              onClick={resetExercise}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={17} />
              Practice again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !exercise || !concept) {
    return (
      <div className="paper-panel rounded-[30px] p-8">
        <CircleAlert className="text-clay-400" size={24} />
        <h2 className="mt-4 font-display text-3xl">The lesson catalog is updating.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-forest-900/60">
          Apply Sapling’s latest Supabase migration to unlock the new A0–A1
          lessons.
        </p>
      </div>
    );
  }

  const progress =
    ((itemIndex + (phase === "attempt" ? 0 : 0.45)) /
      lesson.exercises.length) *
    100;
  const exactTextMatch =
    normalize(submittedResponse) === normalize(exercise.expected);

  return (
    <div className="space-y-5">
      <LessonRail
        completedLessons={completedLessons}
        lessonIndex={lessonIndex}
        onChoose={chooseLesson}
      />
      <div className="paper-panel soft-enter overflow-hidden rounded-[30px]">
        <div className="border-b border-forest-900/8 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.16em] text-forest-700/55">
            <span>
              Lesson {lesson.number} · {lesson.title}
            </span>
            <span>
              {itemIndex + 1} of {lesson.exercises.length}
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
              <div className="mt-4">
                <DanishAudioButton
                  clipId={exercise.audioId}
                  label="Hear the answer"
                  showSlowControl
                />
              </div>
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
                  <div className="mt-4">
                    <DanishAudioButton clipId={exercise.audioId} showSlowControl />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-forest-900/[0.045] p-4 text-sm leading-6 text-forest-900/62">
                <Sparkles className="mt-0.5 shrink-0 text-moss-500" size={17} />
                <span>
                  {exercise.note}{" "}
                  {exactTextMatch
                    ? "The text also matches exactly."
                    : "Judge the idea, not only punctuation."}
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
              <div className="mt-4 rounded-2xl bg-moss-400/12 p-4">
                <p className="text-lg font-semibold text-forest-950">
                  {exercise.expected}
                </p>
                <div className="mt-3">
                  <DanishAudioButton clipId={exercise.audioId} />
                </div>
              </div>
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
    </div>
  );
}

function LessonRail({
  completedLessons,
  lessonIndex,
  onChoose,
}: {
  completedLessons: boolean[];
  lessonIndex: number;
  onChoose: (index: number) => void;
}) {
  return (
    <div className="paper-panel overflow-x-auto rounded-[24px] p-3">
      <div className="flex min-w-max gap-2">
        {lessons.map((lesson, index) => {
          const active = index === lessonIndex;
          const complete = completedLessons[index];
          const next = !complete && completedLessons.slice(0, index).every(Boolean);
          return (
            <button
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-left text-xs font-bold transition ${
                active
                  ? "bg-forest-900 text-cream-50"
                  : "bg-white/45 text-forest-900/62 hover:bg-white/75"
              }`}
              key={lesson.id}
              onClick={() => onChoose(index)}
              type="button"
            >
              {complete ? (
                <CheckCircle2 aria-hidden="true" size={16} />
              ) : next ? (
                <Sparkles aria-hidden="true" size={16} />
              ) : (
                <Circle aria-hidden="true" size={15} />
              )}
              <span>
                {lesson.number}. {lesson.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
