"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleHelp,
  LoaderCircle,
  LockKeyhole,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DanishAudioButton } from "@/components/danish-audio-button";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { useDanishSpeechRecognition } from "@/hooks/use-danish-speech-recognition";
import { lessons } from "@/lib/learning/course";
import {
  calculateBeginnerPronunciationScore,
  calculatePhraseCoverage,
  pronunciationAttemptQuality,
  pronunciationBand,
} from "@/lib/learning/speech-scoring";
import type {
  DanishSpeechResult,
  LessonEvaluation,
} from "@/types/lesson-evaluation";

type Phase = "attempt" | "feedback" | "reveal" | "complete";

const GUIDED_PRONUNCIATION_TARGET = 0.7;
const GUIDED_ATTEMPTS_BEFORE_SKIP = 3;

export function LearnSession() {
  const {
    concepts,
    states,
    isLoading,
    error: modelError,
    recordRetrievalAttempt,
    recordRepair,
    recordSpeakingAttempt,
  } = useLearningModel();
  const [lessonIndex, setLessonIndex] = useState(0);
  const [exerciseQueue, setExerciseQueue] = useState<number[]>([0, 1, 2]);
  const [queuePosition, setQueuePosition] = useState(0);
  const [phase, setPhase] = useState<Phase>("attempt");
  const [evaluation, setEvaluation] = useState<LessonEvaluation | null>(null);
  const [speechResult, setSpeechResult] = useState<DanishSpeechResult | null>(
    null,
  );
  const [revealSpeechResult, setRevealSpeechResult] =
    useState<DanishSpeechResult | null>(null);
  const [revealAttemptCount, setRevealAttemptCount] = useState(0);
  const [usedAudioHint, setUsedAudioHint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const didChooseStartingLesson = useRef(false);
  const startedAt = useRef<number | null>(null);
  const attemptLatencyMs = useRef(0);
  const {
    isRecording,
    liveTranscript,
    recordingStatus,
    resetTranscript,
    start: startRecognition,
    stop: stopRecognition,
  } = useDanishSpeechRecognition();

  const stateByConcept = useMemo(
    () => new Map(states.map((state) => [state.conceptId, state])),
    [states],
  );
  const conceptBySlug = useMemo(
    () => new Map(concepts.map((concept) => [concept.slug, concept])),
    [concepts],
  );
  const masteredExerciseCounts = lessons.map(
    (lesson) =>
      lesson.exercises.filter((exercise) => {
        const concept = conceptBySlug.get(exercise.conceptSlug);
        return concept
          ? (stateByConcept.get(concept.id)?.successfulRetrievalCount ?? 0) > 0
          : false;
      }).length,
  );
  const completedLessons = lessons.map(
    (lesson, index) => masteredExerciseCounts[index] === lesson.exercises.length,
  );
  const firstIncompleteLesson = completedLessons.findIndex(
    (complete) => !complete,
  );
  const unlockedLessonIndex =
    firstIncompleteLesson === -1 ? lessons.length - 1 : firstIncompleteLesson;

  const getPracticeQueue = useCallback(
    (index: number) => {
      const targetLesson = lessons[index];
      const unfinished = targetLesson.exercises.flatMap(
        (exercise, exerciseIndex) => {
          const concept = conceptBySlug.get(exercise.conceptSlug);
          const mastered = concept
            ? (stateByConcept.get(concept.id)?.successfulRetrievalCount ?? 0) > 0
            : false;
          return mastered ? [] : [exerciseIndex];
        },
      );

      return unfinished.length > 0
        ? unfinished
        : targetLesson.exercises.map((_, exerciseIndex) => exerciseIndex);
    },
    [conceptBySlug, stateByConcept],
  );

  useEffect(() => {
    if (isLoading || didChooseStartingLesson.current) {
      return;
    }

    const startingLesson =
      firstIncompleteLesson === -1 ? lessons.length - 1 : firstIncompleteLesson;
    setLessonIndex(startingLesson);
    setExerciseQueue(getPracticeQueue(startingLesson));
    setQueuePosition(0);
    didChooseStartingLesson.current = true;
  }, [firstIncompleteLesson, getPracticeQueue, isLoading]);

  const lesson = lessons[lessonIndex];
  const exerciseIndex = exerciseQueue[queuePosition] ?? 0;
  const exercise = lesson?.exercises[exerciseIndex];
  const concept = exercise ? conceptBySlug.get(exercise.conceptSlug) : undefined;

  function resetExercise() {
    setQueuePosition(0);
    setPhase("attempt");
    setEvaluation(null);
    setSpeechResult(null);
    setRevealSpeechResult(null);
    setRevealAttemptCount(0);
    setUsedAudioHint(false);
    resetTranscript();
    setActionError(null);
    startedAt.current = null;
    attemptLatencyMs.current = 0;
  }

  function chooseLesson(index: number) {
    if (index > unlockedLessonIndex) {
      return;
    }

    setLessonIndex(index);
    setExerciseQueue(getPracticeQueue(index));
    resetExercise();
  }

  function moveForward() {
    if (!lesson || queuePosition === exerciseQueue.length - 1) {
      setPhase("complete");
      return;
    }
    setQueuePosition((current) => current + 1);
    setPhase("attempt");
    setEvaluation(null);
    setSpeechResult(null);
    setRevealSpeechResult(null);
    setRevealAttemptCount(0);
    setUsedAudioHint(false);
    resetTranscript();
    startedAt.current = null;
    attemptLatencyMs.current = 0;
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
      resetTranscript();
      setRevealSpeechResult(null);
      setRevealAttemptCount(0);
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

  async function startVoiceAttempt() {
    if (!concept || !exercise || !lesson || isRecording || isSaving) {
      return;
    }

    setActionError(null);
    setEvaluation(null);
    setSpeechResult(null);

    try {
      const spoken = await startRecognition({ mode: "open" });
      attemptLatencyMs.current = spoken.durationMs;
      setSpeechResult(spoken);
      setIsSaving(true);

      const evaluationResponse = await fetch("/api/learning/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          exerciseId: exercise.audioId,
          transcript: spoken.recognizedText,
          alternatives: spoken.alternatives,
        }),
      });
      const evaluationBody = (await evaluationResponse.json()) as
        | LessonEvaluation
        | { error?: string };

      if (!evaluationResponse.ok || !("successful" in evaluationBody)) {
        throw new Error(
          "error" in evaluationBody && evaluationBody.error
            ? evaluationBody.error
            : "Sapling couldn’t interpret that answer.",
        );
      }

      const attemptContext = {
        lessonId: lesson.id,
        exerciseId: exercise.audioId,
        activityType: exercise.eyebrow,
        responseMode: "speech",
        assisted: usedAudioHint,
        evaluationProvider: evaluationBody.source,
        meaningScore: evaluationBody.meaningScore,
        grammarScore: evaluationBody.grammarScore,
        vocabularyScore: evaluationBody.vocabularyScore,
        feedbackSummary: evaluationBody.summary,
        feedbackTips: evaluationBody.tips
          .map((tip) => `${tip.area}: ${tip.message}`)
          .join(" | "),
        source: "lesson-course",
      };

      if (usedAudioHint) {
        await recordRepair({
          conceptId: concept.id,
          responseText: spoken.recognizedText,
          targetText: evaluationBody.correctedDanish,
          context: attemptContext,
        });
      } else {
        await recordRetrievalAttempt({
          conceptId: concept.id,
          responseText: spoken.recognizedText,
          expectedResponse: exercise.expected,
          successful: evaluationBody.successful,
          latencyMs: attemptLatencyMs.current,
          context: attemptContext,
        });
      }

      setEvaluation(evaluationBody);
      setPhase("feedback");
    } catch (voiceError) {
      setActionError(
        voiceError instanceof Error
          ? voiceError.message
          : "Sapling couldn’t score that answer.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function retryVoiceAttempt() {
    setEvaluation(null);
    setSpeechResult(null);
    resetTranscript();
    setActionError(null);
    setPhase("attempt");
    startedAt.current = null;
    attemptLatencyMs.current = 0;
  }

  function showAnswer() {
    setRevealSpeechResult(null);
    setRevealAttemptCount(0);
    resetTranscript();
    setActionError(null);
    setPhase("reveal");
  }

  async function startGuidedPronunciation() {
    if (!concept || !exercise || !lesson || isRecording || isSaving) {
      return;
    }

    setActionError(null);
    resetTranscript();

    try {
      const spoken = await startRecognition({
        mode: "scripted",
        referenceText: exercise.expected,
      });
      const rawPronunciationScore = spoken.pronunciationScore;
      const completenessScore = calculatePhraseCoverage(
        exercise.expected,
        spoken.recognizedText,
      );
      const pronunciationScore = calculateBeginnerPronunciationScore({
        accuracyScore: spoken.accuracyScore,
        wordDetails: spoken.wordDetails,
      });
      const successful =
        pronunciationScore >= GUIDED_PRONUNCIATION_TARGET &&
        completenessScore >= 0.8;
      const scoredAttempt = {
        ...spoken,
        completenessScore,
        fluencyScore: spoken.fluencyScore * completenessScore,
        pronunciationScore,
        successful,
      };
      setRevealSpeechResult((current) =>
        !current ||
        pronunciationAttemptQuality(scoredAttempt) >
          pronunciationAttemptQuality(current)
          ? scoredAttempt
          : current,
      );
      setRevealAttemptCount((current) => current + 1);
      setIsSaving(true);

      await recordSpeakingAttempt({
        conceptId: concept.id,
        referenceText: exercise.expected,
        ...scoredAttempt,
        context: {
          lessonId: lesson.id,
          exerciseId: exercise.audioId,
          provider: "azure-speech",
          locale: "da-DK",
          assessmentMode: "scripted-repair",
          rawPronunciationScore,
          audioRetained: false,
          source: "lesson-course",
        },
      });
    } catch (voiceError) {
      setActionError(
        voiceError instanceof Error
          ? voiceError.message
          : "Sapling couldn’t score that pronunciation.",
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
    const lessonMastered = completedLessons[lessonIndex];
    const remainingIdeas =
      lesson.exercises.length - masteredExerciseCounts[lessonIndex];
    const hasNextLesson = lessonMastered && lessonIndex < lessons.length - 1;
    return (
      <div className="space-y-5">
        <LessonRail
          completedLessons={completedLessons}
          lessonIndex={lessonIndex}
          masteredExerciseCounts={masteredExerciseCounts}
          onChoose={chooseLesson}
          unlockedLessonIndex={unlockedLessonIndex}
        />
        <div className="paper-panel soft-enter rounded-[30px] p-7 sm:p-10">
          <div className="grid size-14 place-items-center rounded-2xl bg-moss-400/20 text-forest-800">
            <Sparkles aria-hidden="true" size={25} />
          </div>
          <h2 className="mt-8 max-w-xl font-display text-4xl leading-[1.06] text-forest-950 sm:text-5xl">
            {lessonMastered
              ? `${lesson.title} complete.`
              : `${remainingIdeas} ${remainingIdeas === 1 ? "idea" : "ideas"} left.`}
          </h2>
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
            {!lessonMastered ? (
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
                onClick={() => chooseLesson(lessonIndex)}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={17} />
                Review {remainingIdeas === 1 ? "that idea" : "those ideas"}
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3 text-sm font-bold text-forest-900 transition hover:bg-white"
                onClick={() => chooseLesson(lessonIndex)}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={17} />
                Practice this lesson
              </button>
            )}
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
    ((queuePosition + (phase === "attempt" ? 0 : 0.45)) /
      exerciseQueue.length) *
    100;
  return (
    <div className="space-y-5">
      <LessonRail
        completedLessons={completedLessons}
        lessonIndex={lessonIndex}
        masteredExerciseCounts={masteredExerciseCounts}
        onChoose={chooseLesson}
        unlockedLessonIndex={unlockedLessonIndex}
      />
      <div className="paper-panel soft-enter overflow-hidden rounded-[30px]">
        <div className="border-b border-forest-900/8 px-6 py-5 sm:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-forest-700/65">
            Lesson {lesson.number} · {lesson.title}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
            <div
              className="h-full rounded-full bg-moss-500 transition-[width] duration-500"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          {phase === "attempt" ? (
            <div>
              <h2 className="max-w-3xl font-display text-3xl leading-tight text-forest-950 sm:text-4xl lg:text-[44px]">
                {exercise.prompt}
              </h2>
              <div className="mt-5">
                <DanishAudioButton
                  clipId={exercise.audioId}
                  label="Hear an example"
                  onPlay={() => setUsedAudioHint(true)}
                  showSlowControl
                />
              </div>
              <div
                aria-live="polite"
                className={`mt-8 rounded-[22px] border p-5 ${
                  isRecording || isSaving
                    ? "border-moss-500/25 bg-moss-400/10"
                    : "border-forest-900/10 bg-white/55"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/65 text-forest-800">
                    {isSaving ? (
                      <Sparkles className="animate-pulse" aria-hidden="true" size={19} />
                    ) : (
                      <Mic aria-hidden="true" size={19} />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">
                      {isSaving
                        ? "Understanding your answer"
                        : recordingStatus === "starting"
                          ? "Opening microphone"
                          : recordingStatus === "stopping"
                            ? "Finishing transcript"
                            : recordingStatus === "listening"
                              ? "Listening"
                              : "Answer in Danish"}
                    </p>
                    <p className="mt-1 min-h-7 text-lg font-semibold text-forest-950" lang="da">
                      {liveTranscript || (isRecording ? "Sig dit svar…" : "Tap Start speaking when you’re ready.")}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-forest-900/62">
                <ShieldCheck className="shrink-0 text-moss-500" size={15} />
                Audio is discarded after scoring.
              </p>
              <div className="mt-5 grid gap-3 sm:flex">
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3.5 text-sm font-bold text-forest-900 transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  disabled={isSaving || isRecording}
                  onClick={markNotSure}
                  type="button"
                >
                  <CircleHelp aria-hidden="true" size={17} />
                  Not sure
                </button>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  disabled={isSaving || recordingStatus === "starting" || recordingStatus === "stopping"}
                  onClick={
                    recordingStatus === "listening"
                      ? stopRecognition
                      : startVoiceAttempt
                  }
                  type="button"
                >
                  {isSaving || recordingStatus === "starting" || recordingStatus === "stopping" ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
                  ) : recordingStatus === "listening" ? (
                    <Square aria-hidden="true" fill="currentColor" size={15} />
                  ) : (
                    <Mic aria-hidden="true" size={18} />
                  )}
                  {isSaving
                    ? "Checking answer…"
                    : recordingStatus === "starting"
                      ? "Preparing…"
                      : recordingStatus === "listening"
                        ? "Stop & check"
                        : recordingStatus === "stopping"
                          ? "Finishing…"
                          : "Start speaking"}
                </button>
              </div>
            </div>
          ) : null}

          {phase === "reveal" ? (
            <div className="soft-enter">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-forest-700/70">
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
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-forest-900/[0.055] p-5 text-base leading-7 text-forest-900/78">
                <Sparkles className="mt-1 shrink-0 text-moss-500" size={18} />
                <span>{exercise.note}</span>
              </div>

              <div className="mt-6 rounded-[22px] border border-forest-900/10 bg-white/55 p-5 sm:p-6">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-forest-700/70">
                  Repeat it
                </p>
                <div aria-live="polite" className="mt-3">
                  <p className="min-h-7 text-lg font-semibold leading-8 text-forest-950" lang="da">
                    {liveTranscript ||
                      (isRecording
                        ? "Sig sætningen…"
                        : "Listen, then say the phrase aloud.")}
                  </p>
                </div>

                {revealSpeechResult && !isRecording ? (
                  <div
                    className={`mt-4 rounded-2xl p-4 ${
                      revealSpeechResult.successful
                        ? "bg-moss-400/16"
                        : "bg-amber-400/12"
                    }`}
                  >
                    <p className="text-base font-bold text-forest-950">
                      {revealSpeechResult.successful
                        ? "Good pronunciation — keep going."
                        : `${pronunciationBand(revealSpeechResult.pronunciationScore)} — listen and try once more.`}
                    </p>
                    <p className="mt-2 text-base leading-7 text-forest-900/78">
                      Best attempt · Pronunciation {Math.round(revealSpeechResult.pronunciationScore * 100)}
                      · Phrase {Math.round(revealSpeechResult.completenessScore * 100)}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={
                      isSaving ||
                      recordingStatus === "starting" ||
                      recordingStatus === "stopping"
                    }
                    onClick={
                      recordingStatus === "listening"
                        ? stopRecognition
                        : startGuidedPronunciation
                    }
                    type="button"
                  >
                    {isSaving ||
                    recordingStatus === "starting" ||
                    recordingStatus === "stopping" ? (
                      <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
                    ) : recordingStatus === "listening" ? (
                      <Square aria-hidden="true" fill="currentColor" size={15} />
                    ) : (
                      <Mic aria-hidden="true" size={18} />
                    )}
                    {isSaving
                      ? "Saving…"
                      : recordingStatus === "starting"
                        ? "Preparing…"
                        : recordingStatus === "listening"
                          ? "Stop & score"
                          : recordingStatus === "stopping"
                            ? "Scoring…"
                            : revealSpeechResult
                              ? "Try again"
                              : "Start speaking"}
                  </button>

                  {revealSpeechResult?.successful ? (
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-moss-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-moss-600"
                      onClick={moveForward}
                      type="button"
                    >
                      Continue
                      <ArrowRight aria-hidden="true" size={17} />
                    </button>
                  ) : revealAttemptCount >= GUIDED_ATTEMPTS_BEFORE_SKIP ? (
                    <button
                      className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-forest-900/65 transition hover:bg-white/70"
                      onClick={moveForward}
                      type="button"
                    >
                      Skip for now
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {phase === "feedback" && evaluation && speechResult ? (
            <div className="soft-enter">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                  evaluation.successful
                    ? "bg-moss-400/18 text-forest-800"
                    : "bg-amber-400/16 text-amber-500"
                }`}
              >
                {evaluation.successful ? (
                  <Check aria-hidden="true" size={15} />
                ) : (
                  <RotateCcw aria-hidden="true" size={15} />
                )}
                {evaluation.successful ? "Meaning understood" : "Try once more"}
              </div>
              <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight text-forest-950 sm:text-4xl">
                {evaluation.summary}
              </h2>

              <div className="mt-6 rounded-[22px] border border-forest-900/10 bg-white/55 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/68">
                  Sapling heard
                </p>
                <p className="mt-3 text-xl font-medium leading-8 text-forest-950" lang="da">
                  {speechResult.recognizedText}
                </p>
              </div>

              {evaluation.correctedDanish !== speechResult.recognizedText ||
              evaluation.tips.length > 0 ? (
                <div className="mt-4 rounded-[22px] border border-moss-500/20 bg-moss-400/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/68">
                    A natural version
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-9 text-forest-950" lang="da">
                    {evaluation.correctedDanish}
                  </p>
                  <div className="mt-4">
                    <DanishAudioButton
                      clipId={exercise.audioId}
                      label="Hear an example"
                      showSlowControl
                    />
                  </div>
                </div>
              ) : null}

              {evaluation.tips.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {evaluation.tips.map((tip) => (
                    <div className="rounded-2xl bg-white/65 p-5" key={`${tip.area}-${tip.message}`}>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/68">
                        {tip.area}
                      </p>
                      <p className="mt-2 text-base leading-7 text-forest-950">
                        {tip.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-7 grid gap-3 sm:flex">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-forest-900/12 bg-white/70 px-5 py-3.5 text-sm font-bold text-forest-900 transition hover:bg-white disabled:opacity-50"
                  onClick={retryVoiceAttempt}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" size={17} />
                  Try again
                </button>
                {evaluation.successful ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
                    onClick={moveForward}
                    type="button"
                  >
                    Continue
                    <ArrowRight aria-hidden="true" size={17} />
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
                    onClick={showAnswer}
                    type="button"
                  >
                    Show answer
                    <ArrowRight aria-hidden="true" size={17} />
                  </button>
                )}
              </div>
            </div>
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
  masteredExerciseCounts,
  onChoose,
  unlockedLessonIndex,
}: {
  completedLessons: boolean[];
  lessonIndex: number;
  masteredExerciseCounts: number[];
  onChoose: (index: number) => void;
  unlockedLessonIndex: number;
}) {
  return (
    <div className="paper-panel overflow-x-auto rounded-[24px] p-3">
      <div className="flex min-w-max gap-2">
        {lessons.map((lesson, index) => {
          const active = index === lessonIndex;
          const complete = completedLessons[index];
          const locked = index > unlockedLessonIndex;
          const next = index === unlockedLessonIndex && !complete;
          return (
            <button
              aria-current={active ? "step" : undefined}
              aria-label={
                locked
                  ? `${lesson.title} locked. Complete lesson ${index} first.`
                  : `${lesson.title}, ${masteredExerciseCounts[index]} of ${lesson.exercises.length} ideas retrieved`
              }
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-left text-xs font-bold transition ${
                active
                  ? "bg-forest-900 text-cream-50"
                  : locked
                    ? "cursor-not-allowed bg-forest-900/[0.035] text-forest-900/30"
                    : "bg-white/45 text-forest-900/62 hover:bg-white/75"
              }`}
              disabled={locked}
              key={lesson.id}
              onClick={() => onChoose(index)}
              title={
                locked
                  ? `Complete ${lessons[index - 1]?.title ?? "the prior lesson"} to unlock this lesson.`
                  : undefined
              }
              type="button"
            >
              {complete ? (
                <CheckCircle2 aria-hidden="true" size={16} />
              ) : next ? (
                <Sparkles aria-hidden="true" size={16} />
              ) : locked ? (
                <LockKeyhole aria-hidden="true" size={15} />
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
