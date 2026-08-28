"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  MessageCircle,
  Mic,
  Square,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import { useTargetSpeechRecognition } from "@/hooks/use-target-speech-recognition";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { practiceCharacters } from "@/lib/practice/scenarios";
import type { TargetSpeechResult } from "@/types/lesson-evaluation";
import type {
  PracticeMessage,
  PracticeRecommendation,
  PracticeTurnResponse,
  TranscriptResolution,
} from "@/types/practice";

type Phase = "ready" | "active" | "complete";

export function PracticeSession({
  scenarioIds,
  onReturnToWorld,
}: {
  scenarioIds?: readonly string[];
  onReturnToWorld?: () => void;
} = {}) {
  const { targetLanguage } = useLearningModel();
  return (
    <LanguagePracticeSession
      key={`${targetLanguage.code}:${scenarioIds?.join(",") ?? "adaptive"}`}
      onReturnToWorld={onReturnToWorld}
      scenarioIds={scenarioIds}
    />
  );
}

function LanguagePracticeSession({
  scenarioIds,
  onReturnToWorld,
}: {
  scenarioIds?: readonly string[];
  onReturnToWorld?: () => void;
}) {
  const {
    concepts,
    states,
    targetLanguage,
    practiceSnapshot,
    isLoading,
    error: modelError,
    startPracticeSession,
    recordPracticeTurn,
    completePracticeSession,
    deleteLearnerMemory,
  } = useLearningModel();
  const {
    isRecording,
    liveTranscript,
    recordingStatus,
    resetTranscript,
    start,
    stop,
  } = useTargetSpeechRecognition(targetLanguage.locale);
  const recommendation = useMemo(
    () =>
      choosePracticeScenario({
        languageCode: targetLanguage.code,
        concepts,
        states,
        snapshot: practiceSnapshot,
        scenarioIds,
      }),
    [concepts, practiceSnapshot, scenarioIds, states, targetLanguage.code],
  );
  const [activeRecommendation, setActiveRecommendation] =
    useState<PracticeRecommendation | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [goalProgress, setGoalProgress] = useState(0);
  const [lastResponse, setLastResponse] =
    useState<PracticeTurnResponse | null>(null);
  const [surfacedResolutions, setSurfacedResolutions] = useState<
    TranscriptResolution[]
  >([]);
  const [revealedTranslations, setRevealedTranslations] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const currentRecommendation = activeRecommendation ?? recommendation;
  const scenario = currentRecommendation.scenario;
  const character = practiceCharacters[targetLanguage.code];
  const continuity = practiceSnapshot.continuity.find(
    (item) => item.characterId === character.id,
  );

  async function beginPractice() {
    if (isStarting) {
      return;
    }
    setActionError(null);
    setIsStarting(true);
    try {
      const startingRecommendation = currentRecommendation;
      const id = await startPracticeSession({
        languageCode: targetLanguage.code,
        scenarioId: startingRecommendation.scenario.id,
        characterId: startingRecommendation.scenario.characterId,
        readiness: startingRecommendation.readiness,
        encounteredConceptSlugs: startingRecommendation.encounteredConceptSlugs,
      });
      setActiveRecommendation(startingRecommendation);
      setSessionId(id);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "character",
          text: startingRecommendation.scenario.openingLine,
          englishSupport: startingRecommendation.scenario.openingEnglish,
        },
      ]);
      setTurnCount(0);
      setGoalProgress(0);
      setLastResponse(null);
      setSurfacedResolutions([]);
      setRevealedTranslations([]);
      resetTranscript();
      setPhase("active");
    } catch (startError) {
      setActionError(
        startError instanceof Error
          ? startError.message
          : "Sapling could not start this conversation.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function finishPractice(
    summary: string,
    nextGoalProgress: number,
    nextTurnCount: number,
  ) {
    if (!sessionId || isFinishing) {
      return;
    }
    setIsFinishing(true);
    try {
      await completePracticeSession({
        sessionId,
        languageCode: targetLanguage.code,
        scenarioId: scenario.id,
        characterId: scenario.characterId,
        turnCount: nextTurnCount,
        goalProgress: nextGoalProgress,
        summary,
      });
      setPhase("complete");
    } catch (finishError) {
      setActionError(
        finishError instanceof Error
          ? finishError.message
          : "Sapling could not finish this conversation.",
      );
    } finally {
      setIsFinishing(false);
    }
  }

  async function submitSpeech(speech: TargetSpeechResult) {
    if (!sessionId || isSubmitting) {
      return;
    }
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/practice/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageCode: targetLanguage.code,
          scenarioId: scenario.id,
          turnIndex: turnCount,
          transcript: speech.recognizedText,
          alternatives: speech.alternatives,
          history: messages.map(({ role, text }) => ({ role, text })),
          encounteredConceptSlugs:
            currentRecommendation.encounteredConceptSlugs,
          memories: practiceSnapshot.memories.map(
            ({ label, value, category }) => ({ label, value, category }),
          ),
          continuitySummary: continuity?.summary ?? null,
        }),
      });
      const body = (await response.json()) as PracticeTurnResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Sapling could not continue the conversation.");
      }

      const nextTurnCount = turnCount + 1;
      const learnerMessage: PracticeMessage = {
        id: crypto.randomUUID(),
        role: "learner",
        text: speech.recognizedText,
      };
      const characterMessage: PracticeMessage = {
        id: crypto.randomUUID(),
        role: "character",
        text: body.reply,
        englishSupport: body.englishSupport,
      };
      setMessages((current) => [
        ...current,
        learnerMessage,
        characterMessage,
      ]);
      setTurnCount(nextTurnCount);
      setGoalProgress(body.goalProgress);
      setLastResponse(body);
      if (body.resolution.surfaceAfterSession) {
        setSurfacedResolutions((current) => [...current, body.resolution]);
      }

      await recordPracticeTurn({
        sessionId,
        languageCode: targetLanguage.code,
        scenarioId: scenario.id,
        characterId: scenario.characterId,
        position: turnCount,
        resolution: body.resolution,
        alternatives: speech.alternatives,
        replyText: body.reply,
        meaningScore: body.meaningScore,
        grammarScore: body.grammarScore,
        vocabularyScore: body.vocabularyScore,
        speechMetrics: {
          durationMs: speech.durationMs,
          accuracyScore: speech.accuracyScore > 0 ? speech.accuracyScore : null,
          fluencyScore: speech.fluencyScore > 0 ? speech.fluencyScore : null,
          completenessScore:
            speech.completenessScore > 0 ? speech.completenessScore : null,
          pronunciationScore:
            speech.pronunciationScore > 0 ? speech.pronunciationScore : null,
        },
        evidence: body.evidence,
        memories: body.memories,
      });
      resetTranscript();

      if (body.complete) {
        await finishPractice(
          body.continuityNote,
          body.goalProgress,
          nextTurnCount,
        );
      }
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "Sapling could not understand that turn.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMicrophone() {
    if (isSubmitting || isFinishing) {
      return;
    }
    if (isRecording) {
      stop();
      return;
    }
    setActionError(null);
    try {
      const speech = await start({ mode: "open" });
      await submitSpeech(speech);
    } catch (speechError) {
      setActionError(
        speechError instanceof Error
          ? speechError.message
          : "Sapling could not hear that response.",
      );
    }
  }

  function prepareNextPractice() {
    setActiveRecommendation(null);
    setSessionId(null);
    setMessages([]);
    setLastResponse(null);
    setPhase("ready");
  }

  if (isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="paper-panel h-[34rem] animate-pulse rounded-[28px]" />
        <div className="paper-panel h-72 animate-pulse rounded-[24px]" />
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="relative overflow-hidden rounded-[28px] bg-forest-950 p-6 text-cream-50 shadow-2xl shadow-forest-950/16 sm:p-9">
          <div className="absolute -right-20 -top-24 size-72 rounded-full border border-cream-100/8" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-[16px] bg-cream-100/10 text-lg font-extrabold">
                {character.name[0]}
              </span>
              <span className="rounded-full bg-cream-100/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-cream-100/70">
                {currentRecommendation.reason}
              </span>
            </div>
            <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.16em] text-moss-300">
              Next conversation
            </p>
            <h2 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
              {scenario.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-cream-100/66">
              {scenario.setting}
            </p>
            <div className="mt-7 rounded-[20px] border border-cream-100/10 bg-cream-100/6 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cream-100/45">
                Your goal
              </p>
              <p className="mt-2 text-base font-bold leading-6 text-cream-50">
                {scenario.goal}
              </p>
            </div>
            <button
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] bg-cream-100 px-5 text-sm font-extrabold text-forest-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
              disabled={isStarting}
              onClick={beginPractice}
              type="button"
            >
              {isStarting ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <MessageCircle size={17} />
              )}
              Start with {character.name}
            </button>
          </div>
        </section>

        <PracticeContext
          continuitySummary={continuity?.summary ?? null}
          encounterCount={continuity?.encounterCount ?? 0}
          memories={practiceSnapshot.memories}
          onDeleteMemory={deleteLearnerMemory}
          scenario={scenario}
        />

        {actionError || modelError ? (
          <ActionError message={actionError ?? modelError ?? ""} />
        ) : null}
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="paper-panel rounded-[28px] p-6 sm:p-9">
          <span className="grid size-12 place-items-center rounded-[16px] bg-moss-400/22 text-forest-900">
            <Check size={21} />
          </span>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/55">
            Conversation complete
          </p>
          <h2 className="mt-2 font-display text-4xl text-forest-950 sm:text-5xl">
            You kept it moving.
          </h2>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-forest-900/58">
            {lastResponse?.feedback ??
              `You spent ${turnCount} turns using ${targetLanguage.name} with ${character.name}.`}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["Meaning", lastResponse?.meaningScore ?? goalProgress],
              ["Grammar", lastResponse?.grammarScore ?? goalProgress],
              ["Vocabulary", lastResponse?.vocabularyScore ?? goalProgress],
            ].map(([label, score]) => (
              <div className="rounded-[18px] bg-moss-300/16 p-4" key={String(label)}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-forest-700/48">
                  {String(label)}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-forest-950">
                  {Math.round(Number(score) * 100)}
                </p>
              </div>
            ))}
          </div>

          {surfacedResolutions.length > 0 ? (
            <details className="group mt-6 rounded-[18px] border border-forest-950/8 bg-white/45 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-forest-950">
                One speech detail worth noticing
                <ChevronDown className="transition group-open:rotate-180" size={17} />
              </summary>
              <div className="mt-3 space-y-2 border-t border-forest-950/7 pt-3 text-sm text-forest-900/62">
                {surfacedResolutions.map((resolution, index) => (
                  <p key={`${resolution.providerTranscript}-${index}`}>
                    {resolution.invisibleNote}
                  </p>
                ))}
              </div>
            </details>
          ) : null}

          <button
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[15px] bg-forest-950 px-5 text-sm font-extrabold text-cream-50"
            onClick={onReturnToWorld ?? prepareNextPractice}
            type="button"
          >
            {onReturnToWorld ? "Back to Lindbacken" : "See what’s next"}
            <ArrowRight size={17} />
          </button>
        </section>

        <PracticeContext
          continuitySummary={
            lastResponse?.continuityNote ?? continuity?.summary ?? null
          }
          encounterCount={continuity?.encounterCount ?? 1}
          memories={practiceSnapshot.memories}
          onDeleteMemory={deleteLearnerMemory}
          scenario={scenario}
        />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="paper-panel overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between gap-4 border-b border-forest-950/8 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-forest-950 font-extrabold text-cream-50">
              {character.name[0]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-forest-950">
                {scenario.title}
              </p>
              <p className="truncate text-[11px] font-semibold text-forest-900/48">
                with {character.name}
              </p>
            </div>
          </div>
          <button
            className="rounded-xl px-3 py-2 text-xs font-bold text-forest-900/52 transition hover:bg-forest-950/5 hover:text-forest-950"
            disabled={isFinishing}
            onClick={() =>
              void finishPractice(
                lastResponse?.continuityNote ??
                  `Paused ${scenario.title} after ${turnCount} turns.`,
                goalProgress,
                turnCount,
              )
            }
            type="button"
          >
            Move on
          </button>
        </div>

        <div className="min-h-[25rem] space-y-5 p-5 sm:p-7">
          {messages.map((message) => {
            const fromCharacter = message.role === "character";
            const translationVisible = revealedTranslations.includes(message.id);
            return (
              <div
                className={`flex ${fromCharacter ? "justify-start" : "justify-end"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[86%] rounded-[20px] px-4 py-3 text-sm font-semibold leading-6 sm:max-w-[72%] ${
                    fromCharacter
                      ? "rounded-tl-md bg-moss-300/20 text-forest-950"
                      : "rounded-tr-md bg-forest-950 text-cream-50"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.englishSupport ? (
                    <button
                      className={`mt-2 text-[10px] font-bold ${
                        fromCharacter
                          ? "text-forest-700/55"
                          : "text-cream-100/58"
                      }`}
                      onClick={() =>
                        setRevealedTranslations((current) =>
                          current.includes(message.id)
                            ? current.filter((id) => id !== message.id)
                            : [...current, message.id],
                        )
                      }
                      type="button"
                    >
                      {translationVisible ? message.englishSupport : "Show English"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {liveTranscript ? (
            <div className="flex justify-end">
              <div className="max-w-[72%] rounded-[20px] rounded-tr-md border border-forest-950/10 bg-white/45 px-4 py-3 text-sm font-semibold leading-6 text-forest-900/54">
                {liveTranscript}
              </div>
            </div>
          ) : null}

          {isSubmitting || isFinishing ? (
            <div className="flex items-center gap-2 text-xs font-bold text-forest-900/44">
              <LoaderCircle className="animate-spin" size={15} />
              {isFinishing ? "Remembering this encounter…" : `${character.name} is responding…`}
            </div>
          ) : null}
        </div>

        <div className="border-t border-forest-950/8 bg-cream-50/60 p-4 sm:px-6 sm:py-5">
          {actionError || modelError ? (
            <div className="mb-3">
              <ActionError message={actionError ?? modelError ?? ""} />
            </div>
          ) : null}
          <button
            className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-[17px] px-5 text-sm font-extrabold transition disabled:cursor-wait disabled:opacity-55 ${
              isRecording
                ? "bg-clay-400 text-white"
                : "bg-forest-950 text-cream-50 hover:bg-forest-900"
            }`}
            disabled={isSubmitting || isFinishing}
            onClick={() => void handleMicrophone()}
            type="button"
          >
            {recordingStatus === "starting" || recordingStatus === "stopping" ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : isRecording ? (
              <Square fill="currentColor" size={17} />
            ) : (
              <Mic size={19} />
            )}
            {recordingStatus === "starting"
              ? "Opening microphone…"
              : recordingStatus === "listening"
                ? "Finish speaking"
                : recordingStatus === "stopping"
                  ? "Finishing transcript…"
                  : "Start speaking"}
          </button>
          <p className="mt-2 text-center text-[10px] font-semibold text-forest-900/38">
            Speak naturally. Sapling uses the situation to resolve likely misheard words.
          </p>
        </div>
      </section>

      <PracticeContext
        continuitySummary={continuity?.summary ?? null}
        encounterCount={continuity?.encounterCount ?? 0}
        memories={practiceSnapshot.memories}
        onDeleteMemory={deleteLearnerMemory}
        scenario={scenario}
      />
    </div>
  );
}

function PracticeContext({
  scenario,
  encounterCount,
  continuitySummary,
  memories,
  onDeleteMemory,
}: {
  scenario: PracticeRecommendation["scenario"];
  encounterCount: number;
  continuitySummary: string | null;
  memories: ReturnType<typeof useLearningModel>["practiceSnapshot"]["memories"];
  onDeleteMemory: (memoryId: string) => Promise<void>;
}) {
  return (
    <aside className="space-y-4">
      <section className="paper-panel rounded-[22px] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700/50">
          Useful language
        </p>
        <div className="mt-4 space-y-3">
          {scenario.starterHints.map((hint) => (
            <div key={hint.target}>
              <p className="text-sm font-extrabold text-forest-950">
                {hint.target}
              </p>
              <p className="mt-0.5 text-xs font-medium text-forest-900/46">
                {hint.english}
              </p>
            </div>
          ))}
        </div>
      </section>

      {encounterCount > 0 || continuitySummary ? (
        <section className="rounded-[22px] bg-moss-300/18 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700/50">
            Continuity
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-forest-950">
            {encounterCount} {encounterCount === 1 ? "encounter" : "encounters"}
          </p>
          {continuitySummary ? (
            <p className="mt-2 text-xs font-medium leading-5 text-forest-900/54">
              {continuitySummary}
            </p>
          ) : null}
        </section>
      ) : null}

      {memories.length > 0 ? (
        <details className="paper-panel group rounded-[22px] p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold text-forest-950">
            What Sapling remembers
            <ChevronDown className="transition group-open:rotate-180" size={17} />
          </summary>
          <div className="mt-4 space-y-2 border-t border-forest-950/8 pt-4">
            {memories.map((memory) => (
              <div
                className="flex items-start justify-between gap-3 rounded-[14px] bg-white/48 p-3"
                key={memory.id}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-forest-700/43">
                    {memory.label}
                  </p>
                  <p className="mt-0.5 break-words text-xs font-bold text-forest-950">
                    {memory.value}
                  </p>
                </div>
                <button
                  aria-label={`Forget ${memory.label}`}
                  className="shrink-0 rounded-lg p-1.5 text-forest-900/35 transition hover:bg-clay-400/10 hover:text-clay-400"
                  onClick={() => void onDeleteMemory(memory.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </aside>
  );
}

function ActionError({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-[14px] bg-clay-400/10 p-3 text-xs font-semibold leading-5 text-forest-900">
      <CircleAlert className="mt-0.5 shrink-0 text-clay-400" size={15} />
      {message}
    </p>
  );
}
