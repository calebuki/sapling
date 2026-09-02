"use client";

import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleHelp,
  Ear,
  Keyboard,
  LoaderCircle,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import { TargetAudioButton } from "@/components/target-audio-button";
import { useTargetSpeechRecognition } from "@/hooks/use-target-speech-recognition";
import {
  getCourse,
  type Lesson,
  type LessonExercise,
  type ListenSpeakItem,
} from "@/lib/learning/course";
import { createEmptyState } from "@/lib/learning/model";
import {
  EVALUATOR_VERSION,
  planAdaptiveReview,
  SCORER_VERSION,
  SCHEDULER_VERSION,
  scoreOpenResponse,
} from "@/lib/learning/scheduler";
import {
  calculateBeginnerPronunciationScore,
  calculatePhraseCoverage,
  pronunciationBand,
} from "@/lib/learning/speech-scoring";
import type { LessonEvaluation, TargetSpeechResult } from "@/types/lesson-evaluation";
import type { Concept, LearnerConceptState, LearningSessionPlan } from "@/types/learning";

type RetrievalPlanItem = {
  id: string;
  kind: "retrieval";
  concept: Concept;
  lesson: Lesson;
  exercise: LessonExercise;
};

type ListeningPlanItem = {
  id: string;
  kind: "listening";
  concept: Concept;
  item: ListenSpeakItem;
};

type PlanItem = RetrievalPlanItem | ListeningPlanItem;
type Phase = "attempt" | "feedback" | "reveal" | "pronunciation" | "complete";

type AttemptFeedback = {
  evaluation: LessonEvaluation;
  response: string;
  successful: boolean;
};

const ITEMS_PER_SESSION = 7;
const PRONUNCIATION_TARGET = 0.7;

function interleave<T>(left: T[], right: T[]) {
  return Array.from({ length: Math.max(left.length, right.length) }, (_, index) => [
    left[index],
    right[index],
  ]).flatMap((pair) => pair.filter((item): item is T => Boolean(item)));
}

function buildPlan(
  concepts: Concept[],
  states: LearnerConceptState[],
  lessons: Lesson[],
  listeningItems: ListenSpeakItem[],
) {
  const conceptBySlug = new Map(concepts.map((concept) => [concept.slug, concept]));
  const stateByConcept = new Map(states.map((state) => [state.conceptId, state]));
  const retrievalVariants = new Map<string, Array<{ lesson: Lesson; exercise: LessonExercise }>>();
  const listeningVariants = new Map<string, ListenSpeakItem[]>();

  for (const lesson of lessons) {
    for (const exercise of lesson.exercises) {
      const variants = retrievalVariants.get(exercise.conceptSlug) ?? [];
      variants.push({ lesson, exercise });
      retrievalVariants.set(exercise.conceptSlug, variants);
    }
  }

  for (const item of listeningItems) {
    const variants = listeningVariants.get(item.conceptSlug) ?? [];
    variants.push(item);
    listeningVariants.set(item.conceptSlug, variants);
  }

  const retrieval = planAdaptiveReview(
    [...retrievalVariants.entries()].flatMap(([slug, variants]) => {
      const concept = conceptBySlug.get(slug);
      if (!concept) return [];
      const state = stateByConcept.get(concept.id) ?? createEmptyState(concept.id);
      const variant = variants[state.independentRetrievalCount % variants.length];
      return [{
        id: `recall:${concept.id}`,
        dimension: variant.exercise.mode === "open" ? "communicativeUse" as const : "recall" as const,
        state,
        sortOrder: concept.sortOrder,
        value: {
          id: `recall:${variant.exercise.audioId}`,
          kind: "retrieval" as const,
          concept,
          ...variant,
        },
      }];
    }),
    { limit: 4 },
  );

  const listening = planAdaptiveReview(
    [...listeningVariants.entries()].flatMap(([slug, variants]) => {
      const concept = conceptBySlug.get(slug);
      if (!concept) return [];
      const state = stateByConcept.get(concept.id) ?? createEmptyState(concept.id);
      const item = variants[state.exposureCount % variants.length];
      return [{
        id: `listen:${concept.id}`,
        dimension: "recognitionAudio" as const,
        state,
        sortOrder: concept.sortOrder,
        value: {
          id: `listen:${item.id}`,
          kind: "listening" as const,
          concept,
          item,
        },
      }];
    }),
    { limit: 3 },
  );

  return interleave<PlanItem>(retrieval, listening).slice(0, ITEMS_PER_SESSION);
}

export function LearnSession() {
  const { targetLanguage } = useLearningModel();
  return <LanguageLearnSession key={targetLanguage.code} />;
}

function LanguageLearnSession() {
  const {
    completeSession,
    concepts,
    error: modelError,
    isLoading,
    recordListeningAttempt,
    recordRepair,
    recordRetrievalAttempt,
    recordSpeakingAttempt,
    startSession,
    states,
    targetLanguage,
  } = useLearningModel();
  const course = getCourse(targetLanguage.code);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [isPreparing, setIsPreparing] = useState(true);
  const [session, setSession] = useState<LearningSessionPlan>({ id: null, itemIds: [] });
  const [itemIndex, setItemIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("attempt");
  const [response, setResponse] = useState("");
  const [typedRepair, setTypedRepair] = useState("");
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [playbackCount, setPlaybackCount] = useState(0);
  const [usedSlowPlayback, setUsedSlowPlayback] = useState(false);
  const [usedAudioHint, setUsedAudioHint] = useState(false);
  const [answerWasVisible, setAnswerWasVisible] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<TargetSpeechResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [independentSuccesses, setIndependentSuccesses] = useState(0);
  const didPrepare = useRef(false);
  const promptShownAt = useRef(0);
  const responseStartedAt = useRef<number | null>(null);
  const listeningStartedAt = useRef<number | null>(null);
  const {
    isRecording,
    liveTranscript,
    recordingStatus,
    resetTranscript,
    start: startRecognition,
    stop: stopRecognition,
  } = useTargetSpeechRecognition(targetLanguage.locale);

  const prepare = useCallback(() =>
    buildPlan(concepts, states, course.lessons, course.listenSpeakItems),
  [concepts, course.lessons, course.listenSpeakItems, states]);

  useEffect(() => {
    if (isLoading || didPrepare.current) return;
    didPrepare.current = true;
    const nextItems = prepare();
    setItems(nextItems);
    setIsPreparing(false);
    void startSession({
      kind: "learn",
      plannerVersion: SCHEDULER_VERSION,
      items: nextItems.map((item) => ({
        activityType: item.kind === "listening" ? "listening" : "cold_recall",
        conceptId: item.concept.id,
        targetDimension: item.kind === "listening"
          ? "recognitionAudio"
          : item.exercise.mode === "open"
            ? "communicativeUse"
            : "recall",
        prompt: {
          sourceId: item.kind === "listening" ? item.item.id : item.exercise.audioId,
          source: "adaptive-learn",
        },
      })),
    }).then(setSession).catch(() => undefined);
  }, [isLoading, prepare, startSession]);

  const item = items[itemIndex];
  const sessionItemId = session.itemIds[itemIndex] ?? null;

  useEffect(() => {
    if (item && phase === "attempt") {
      promptShownAt.current = performance.now();
      responseStartedAt.current = null;
    }
  }, [item, phase]);

  function resetAttempt() {
    setPhase("attempt");
    setResponse("");
    setTypedRepair("");
    setFeedback(null);
    setSelectedMeaning(null);
    setPlaybackCount(0);
    setUsedSlowPlayback(false);
    setUsedAudioHint(false);
    setAnswerWasVisible(false);
    setPronunciationResult(null);
    setActionError(null);
    listeningStartedAt.current = null;
    resetTranscript();
  }

  function moveForward() {
    if (itemIndex >= items.length - 1) {
      setPhase("complete");
      void completeSession(session.id).catch(() => undefined);
      return;
    }
    setItemIndex((current) => current + 1);
    resetAttempt();
  }

  function restart() {
    const nextItems = prepare();
    setItems(nextItems);
    setItemIndex(0);
    setIndependentSuccesses(0);
    resetAttempt();
    void startSession({
      kind: "learn",
      plannerVersion: SCHEDULER_VERSION,
      items: nextItems.map((nextItem) => ({
        activityType: nextItem.kind === "listening" ? "listening" : "cold_recall",
        conceptId: nextItem.concept.id,
        targetDimension: nextItem.kind === "listening"
          ? "recognitionAudio"
          : nextItem.exercise.mode === "open"
            ? "communicativeUse"
            : "recall",
        prompt: {
          sourceId: nextItem.kind === "listening" ? nextItem.item.id : nextItem.exercise.audioId,
          source: "adaptive-learn",
        },
      })),
    }).then(setSession).catch(() => setSession({ id: null, itemIds: [] }));
  }

  async function evaluateRetrieval(
    activeItem: RetrievalPlanItem,
    answer: string,
    latencyMs: number,
  ) {
    const evaluationResponse = await fetch("/api/learning/evaluate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languageCode: targetLanguage.code,
        lessonId: activeItem.lesson.id,
        exerciseId: activeItem.exercise.audioId,
        transcript: answer,
      }),
    });
    const body = (await evaluationResponse.json()) as LessonEvaluation | { error?: string };
    if (!evaluationResponse.ok || !("meaningScore" in body)) {
      throw new Error("error" in body && body.error ? body.error : "Sapling couldn’t check that answer.");
    }

    const scored = scoreOpenResponse(body);
    const assisted = usedAudioHint || answerWasVisible;
    const evidenceKind = assisted
      ? "assisted_recall" as const
      : activeItem.exercise.mode === "open"
        ? "communicative_use" as const
        : "independent_recall" as const;

    await recordRetrievalAttempt({
      conceptId: activeItem.concept.id,
      responseText: answer,
      expectedResponse: activeItem.exercise.expected,
      successful: scored.successful,
      latencyMs,
      evidenceKind,
      answerVisible: answerWasVisible,
      hintCount: usedAudioHint ? 1 : 0,
      evaluatorVersion: body.evaluatorVersion,
      scorerVersion: scored.scorerVersion,
      sessionId: session.id,
      sessionItemId,
      context: {
        source: "adaptive-learn",
        lessonId: activeItem.lesson.id,
        exerciseId: activeItem.exercise.audioId,
        responseMode: "text",
        evaluationProvider: body.source,
        meaningScore: body.meaningScore,
        grammarScore: body.grammarScore,
        vocabularyScore: body.vocabularyScore,
      },
    });
    if (!assisted && scored.successful) {
      setIndependentSuccesses((current) => current + 1);
    }
    setFeedback({ evaluation: body, response: answer, successful: scored.successful });
    setPhase("feedback");
  }

  async function submitTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || item.kind !== "retrieval" || !response.trim() || isSaving) return;
    const latencyMs = Math.max(
      0,
      Math.round((responseStartedAt.current ?? performance.now()) - promptShownAt.current),
    );
    setIsSaving(true);
    setActionError(null);
    try {
      await evaluateRetrieval(item, response.trim(), latencyMs);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This answer could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitVoice() {
    if (!item || item.kind !== "retrieval" || isRecording || isSaving) return;
    const elapsedBeforeMic = Math.max(0, performance.now() - promptShownAt.current);
    setActionError(null);
    try {
      const spoken = await startRecognition({ mode: "open" });
      setResponse(spoken.recognizedText);
      setIsSaving(true);
      await evaluateRetrieval(
        item,
        spoken.recognizedText,
        Math.round(elapsedBeforeMic + spoken.responseStartLatencyMs),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Speaking is temporarily unavailable.");
    } finally {
      setIsSaving(false);
    }
  }

  async function showAnswer() {
    if (!item || item.kind !== "retrieval" || isSaving) return;
    const latencyMs = Math.max(0, Math.round(performance.now() - promptShownAt.current));
    setIsSaving(true);
    setActionError(null);
    try {
      await recordRetrievalAttempt({
        conceptId: item.concept.id,
        responseText: response.trim(),
        expectedResponse: item.exercise.expected,
        successful: false,
        latencyMs,
        evidenceKind: usedAudioHint ? "assisted_recall" : "independent_recall",
        answerVisible: false,
        hintCount: usedAudioHint ? 1 : 0,
        evaluatorVersion: EVALUATOR_VERSION,
        scorerVersion: SCORER_VERSION,
        sessionId: session.id,
        sessionItemId,
        context: { source: "adaptive-learn", responseMode: "not-sure" },
      });
      setAnswerWasVisible(true);
      setPhase("reveal");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This attempt could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function chooseMeaning(option: string, eventTimestamp: number) {
    if (!item || item.kind !== "listening" || playbackCount === 0 || isSaving) return;
    const successful = option === item.item.meaning;
    const latencyMs = Math.max(
      0,
      Math.round(eventTimestamp - (listeningStartedAt.current ?? eventTimestamp)),
    );
    setSelectedMeaning(option);
    setIsSaving(true);
    setActionError(null);
    try {
      await recordListeningAttempt({
        conceptId: item.concept.id,
        successful,
        score: successful ? 1 : 0,
        latencyMs,
        speakerId: item.item.voice,
        contextId: item.item.id,
        playbackCount,
        usedSlowPlayback,
        taskType: "meaning_selection",
        scorerVersion: SCORER_VERSION,
        sessionId: session.id,
        sessionItemId,
        context: {
          source: "adaptive-learn",
          itemId: item.item.id,
          selectedMeaning: option,
        },
      });
      if (successful && playbackCount === 1 && !usedSlowPlayback) {
        setIndependentSuccesses((current) => current + 1);
      }
      setPhase("feedback");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This listening answer could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function scorePronunciation() {
    if (!item || item.kind !== "listening" || isSaving || isRecording) return;
    setActionError(null);
    try {
      const spoken = await startRecognition({
        mode: "scripted",
        referenceText: item.item.text,
      });
      const completenessScore = calculatePhraseCoverage(item.item.text, spoken.recognizedText);
      const pronunciationScore = calculateBeginnerPronunciationScore({
        accuracyScore: spoken.accuracyScore,
        wordDetails: spoken.wordDetails,
      });
      const scored = {
        ...spoken,
        completenessScore,
        pronunciationScore,
        fluencyScore: spoken.fluencyScore * completenessScore,
        successful: pronunciationScore >= PRONUNCIATION_TARGET && completenessScore >= 0.8,
      };
      setPronunciationResult(scored);
      setIsSaving(true);
      await recordSpeakingAttempt({
        conceptId: item.concept.id,
        referenceText: item.item.text,
        ...scored,
        evidenceKind: "imitation",
        scorerVersion: SCORER_VERSION,
        sessionId: session.id,
        sessionItemId,
        context: {
          source: "adaptive-learn",
          itemId: item.item.id,
          provider: "azure-speech",
          assessmentMode: "scripted",
          audioRetained: false,
        },
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Pronunciation scoring is unavailable.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitTypedImitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || item.kind !== "listening" || !typedRepair.trim() || isSaving) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await recordRepair({
        conceptId: item.concept.id,
        responseText: typedRepair.trim(),
        targetText: item.item.text,
        sessionId: session.id,
        sessionItemId,
        context: {
          source: "adaptive-learn",
          activityType: "typed-imitation",
          pronunciationInferred: false,
        },
      });
      moveForward();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "This response could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isPreparing) {
    return (
      <div className="paper-panel grid min-h-[420px] animate-pulse place-items-center rounded-[24px] text-sm font-semibold text-forest-900/55">
        Preparing today’s review…
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="paper-panel rounded-[24px] p-7 sm:p-9">
        <Sparkles className="text-moss-500" aria-hidden="true" size={28} />
        <h2 className="mt-5 font-display text-4xl text-forest-950">Review complete.</h2>
        <p className="mt-3 text-sm text-forest-900/60">
          {independentSuccesses} unassisted {independentSuccesses === 1 ? "success" : "successes"}; assisted work stays separate.
        </p>
        <button
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3 text-sm font-bold text-cream-50"
          onClick={restart}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={17} />
          Build another review
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="paper-panel rounded-[24px] p-7">
        <CircleAlert className="text-clay-400" size={22} />
        <h2 className="mt-4 font-display text-3xl">No review items are available.</h2>
      </div>
    );
  }

  const progress = ((itemIndex + (phase === "attempt" ? 0 : 0.55)) / items.length) * 100;
  const error = actionError ?? modelError;

  return (
    <div className="paper-panel overflow-hidden rounded-[24px]">
      <div className="border-b border-forest-900/8 px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-forest-700/58">
          <span className="flex items-center gap-2">
            {item.kind === "listening" ? <Ear size={15} /> : <Sparkles size={15} />}
            {item.kind === "listening" ? "Listening" : "Recall"}
          </span>
          <span>{itemIndex + 1} of {items.length}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
          <div className="h-full rounded-full bg-moss-500" style={{ width: `${Math.max(4, progress)}%` }} />
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {item.kind === "retrieval" && phase === "attempt" ? (
          <form onSubmit={submitTyped}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">
              {item.lesson.title}
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-forest-950 sm:text-4xl">
              {item.exercise.prompt}
            </h2>
            <div className="mt-5">
              <TargetAudioButton
                clipId={item.exercise.audioId}
                languageName={targetLanguage.name}
                label="Hear a hint"
                onPlay={() => setUsedAudioHint(true)}
                showSlowControl
              />
            </div>
            <label className="mt-7 block text-sm font-bold text-forest-900/68" htmlFor="learn-answer">
              Your answer
            </label>
            <textarea
              id="learn-answer"
              className="mt-2 min-h-28 w-full resize-y rounded-[18px] border border-forest-900/12 bg-white/65 p-4 text-lg text-forest-950 outline-none focus:border-moss-500"
              disabled={isSaving || isRecording}
              lang={targetLanguage.code}
              onChange={(event) => {
                if (!responseStartedAt.current && event.target.value.length > 0) {
                  responseStartedAt.current = performance.now();
                }
                setResponse(event.target.value);
              }}
              placeholder={targetLanguage.speakPrompt}
              value={response || liveTranscript}
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-[14px] bg-forest-950 px-5 py-3 text-sm font-bold text-cream-50 disabled:opacity-45"
                disabled={!response.trim() || isSaving || isRecording}
                type="submit"
              >
                {isSaving ? <LoaderCircle className="animate-spin" size={17} /> : <Keyboard size={17} />}
                Check answer
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-[14px] border border-forest-900/12 bg-white/70 px-5 py-3 text-sm font-bold text-forest-900 disabled:opacity-45"
                disabled={isSaving || recordingStatus === "starting" || recordingStatus === "stopping"}
                onClick={recordingStatus === "listening" ? stopRecognition : submitVoice}
                type="button"
              >
                {recordingStatus === "listening" ? <Square fill="currentColor" size={14} /> : <Mic size={17} />}
                {recordingStatus === "listening" ? "Stop & check" : "Speak instead"}
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-3 text-sm font-bold text-forest-900/60 disabled:opacity-45"
                disabled={isSaving || isRecording}
                onClick={showAnswer}
                type="button"
              >
                <CircleHelp size={17} />
                Not sure
              </button>
            </div>
          </form>
        ) : null}

        {item.kind === "retrieval" && phase === "feedback" && feedback ? (
          <div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${feedback.successful ? "bg-moss-400/18 text-forest-800" : "bg-amber-400/16 text-amber-600"}`}>
              {feedback.successful ? <Check size={15} /> : <RotateCcw size={15} />}
              {feedback.successful ? "Meaning understood" : "Review and try later"}
            </span>
            <h2 className="mt-5 font-display text-3xl leading-tight text-forest-950 sm:text-4xl">
              {feedback.evaluation.summary}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-white/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-forest-700/55">Your answer</p>
                <p className="mt-2 text-lg text-forest-950" lang={targetLanguage.code}>{feedback.response}</p>
              </div>
              <div className="rounded-[18px] bg-moss-400/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-forest-700/55">Natural version</p>
                <p className="mt-2 text-lg font-semibold text-forest-950" lang={targetLanguage.code}>{feedback.evaluation.correctedTargetText}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-[14px] bg-forest-950 px-5 py-3 text-sm font-bold text-cream-50" onClick={moveForward} type="button">
                Continue <ArrowRight size={17} />
              </button>
              {!feedback.successful ? (
                <button
                  className="inline-flex items-center gap-2 rounded-[14px] border border-forest-900/12 bg-white/70 px-5 py-3 text-sm font-bold text-forest-900"
                  onClick={() => {
                    setAnswerWasVisible(true);
                    setResponse("");
                    setFeedback(null);
                    setPhase("attempt");
                  }}
                  type="button"
                >
                  <RotateCcw size={17} /> Try again with help
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {item.kind === "retrieval" && phase === "reveal" ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">Natural answer</p>
            <h2 className="mt-3 rounded-[20px] bg-moss-400/10 p-5 font-display text-3xl text-forest-950 sm:text-4xl" lang={targetLanguage.code}>
              {item.exercise.expected}
            </h2>
            <p className="mt-4 text-sm text-forest-900/64">{item.exercise.note}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-[14px] bg-forest-950 px-5 py-3 text-sm font-bold text-cream-50" onClick={moveForward} type="button">
                Continue <ArrowRight size={17} />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-[14px] border border-forest-900/12 bg-white/70 px-5 py-3 text-sm font-bold text-forest-900"
                onClick={() => setPhase("attempt")}
                type="button"
              >
                <RotateCcw size={17} /> Try with the answer visible
              </button>
            </div>
          </div>
        ) : null}

        {item.kind === "listening" && phase === "attempt" ? (
          <div>
            <h2 className="font-display text-3xl text-forest-950 sm:text-4xl">What did you hear?</h2>
            <div className="mt-6">
              <TargetAudioButton
                clipId={item.item.audioId}
                languageName={targetLanguage.name}
                label="Play sentence"
                onAssistanceChange={setUsedSlowPlayback}
                onPlay={() => {
                  listeningStartedAt.current ??= performance.now();
                  setPlaybackCount((current) => current + 1);
                }}
                showSlowControl
              />
            </div>
            <div className="mt-7 grid gap-3">
              {item.item.options.map((option) => (
                <button
                  className="rounded-[14px] border border-forest-900/12 bg-white/68 px-5 py-4 text-left text-sm font-bold text-forest-950 disabled:opacity-40"
                  disabled={playbackCount === 0 || isSaving}
                  key={option}
                  onClick={(event) => chooseMeaning(option, event.timeStamp)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {item.kind === "listening" && phase === "feedback" ? (
          <div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${selectedMeaning === item.item.meaning ? "bg-moss-400/18 text-forest-800" : "bg-amber-400/16 text-amber-600"}`}>
              {selectedMeaning === item.item.meaning ? <Check size={15} /> : <RotateCcw size={15} />}
              {selectedMeaning === item.item.meaning ? "You heard it" : "Listen again later"}
            </span>
            <p className="mt-6 text-sm font-bold text-forest-900/55">{item.item.meaning}</p>
            <h2 className="mt-2 font-display text-3xl text-forest-950 sm:text-4xl" lang={targetLanguage.code}>{item.item.text}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-[14px] bg-forest-950 px-5 py-3 text-sm font-bold text-cream-50" onClick={moveForward} type="button">
                Continue <ArrowRight size={17} />
              </button>
              <button className="inline-flex items-center gap-2 rounded-[14px] border border-forest-900/12 bg-white/70 px-5 py-3 text-sm font-bold text-forest-900" onClick={() => setPhase("pronunciation")} type="button">
                <Mic size={17} /> Repeat the phrase
              </button>
            </div>
          </div>
        ) : null}

        {item.kind === "listening" && phase === "pronunciation" ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">Optional pronunciation</p>
            <h2 className="mt-3 font-display text-3xl text-forest-950 sm:text-4xl" lang={targetLanguage.code}>{item.item.text}</h2>
            <p className="mt-3 text-sm text-forest-900/60">Microphone audio is scored, then discarded.</p>
            {pronunciationResult ? (
              <div className="mt-5 rounded-[18px] bg-moss-400/10 p-5">
                <p className="font-bold text-forest-950">{pronunciationBand(pronunciationResult.pronunciationScore)}</p>
                <p className="mt-1 text-sm text-forest-900/60">Pronunciation {Math.round(pronunciationResult.pronunciationScore * 100)} · phrase {Math.round(pronunciationResult.completenessScore * 100)}</p>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-[14px] bg-forest-950 px-5 py-3 text-sm font-bold text-cream-50 disabled:opacity-45"
                disabled={isSaving || recordingStatus === "starting" || recordingStatus === "stopping"}
                onClick={recordingStatus === "listening" ? stopRecognition : scorePronunciation}
                type="button"
              >
                {isSaving ? <LoaderCircle className="animate-spin" size={17} /> : recordingStatus === "listening" ? <Square fill="currentColor" size={14} /> : <Mic size={17} />}
                {recordingStatus === "listening" ? "Stop & score" : pronunciationResult ? "Try again" : "Start speaking"}
              </button>
              <button className="px-3 py-3 text-sm font-bold text-forest-900/62" onClick={moveForward} type="button">
                {actionError ? "I said it correctly — move on" : "Move on"}
              </button>
            </div>
            <form className="mt-6 border-t border-forest-900/8 pt-5" onSubmit={submitTypedImitation}>
              <label className="text-sm font-bold text-forest-900/65" htmlFor="typed-imitation">Type instead</label>
              <div className="mt-2 flex gap-2">
                <input
                  id="typed-imitation"
                  className="min-w-0 flex-1 rounded-[14px] border border-forest-900/12 bg-white/65 px-4 py-3 text-forest-950 outline-none focus:border-moss-500"
                  onChange={(event) => setTypedRepair(event.target.value)}
                  value={typedRepair}
                />
                <button className="rounded-[14px] border border-forest-900/12 bg-white/70 px-4 py-3 text-sm font-bold text-forest-900 disabled:opacity-40" disabled={!typedRepair.trim() || isSaving} type="submit">Continue</button>
              </div>
            </form>
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-clay-400/10 p-3 text-sm text-forest-900">
            <CircleAlert className="mt-0.5 shrink-0 text-clay-400" size={16} />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
