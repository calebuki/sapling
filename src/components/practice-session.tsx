"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Keyboard,
  LoaderCircle,
  MessageCircle,
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { useUiSounds } from "@/components/providers/ui-sound-provider";
import { PracticeRoom, PhraseWarmup } from "@/components/practice-room";
import { useTargetSpeechRecognition } from "@/hooks/use-target-speech-recognition";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { practiceCharacters } from "@/lib/practice/scenarios";
import { getTownQuest, townQuests } from "@/lib/worlds/quests";
import type { TargetSpeechResult } from "@/types/lesson-evaluation";
import type {
  PracticeMessage,
  PracticeRecommendation,
  PracticeTurnResponse,
} from "@/types/practice";

type Props = { scenarioIds?: readonly string[]; onReturnToWorld?: () => void };
type PendingTurn = {
  body: PracticeTurnResponse;
  text: string;
  speech?: TargetSpeechResult;
  assisted: boolean;
};

export function PracticeSession(props: Props = {}) {
  const { targetLanguage } = useLearningModel();
  return (
    <LanguagePracticeSession
      key={`${targetLanguage.code}:${props.scenarioIds?.join(",") ?? "adaptive"}`}
      {...props}
    />
  );
}

function LanguagePracticeSession({ scenarioIds, onReturnToWorld }: Props) {
  const { playSound } = useUiSounds();
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
    [targetLanguage.code, concepts, states, practiceSnapshot, scenarioIds],
  );
  const [activeRecommendation, setActiveRecommendation] =
    useState<PracticeRecommendation | null>(null);
  const current = activeRecommendation ?? recommendation;
  const scenario = current.scenario;
  const character = practiceCharacters[targetLanguage.code];
  const quest =
    targetLanguage.code === "sv" ? getTownQuest(scenario.id) : undefined;
  const continuity = practiceSnapshot.continuity.find(
    (item) => item.characterId === character.id,
  );
  const collected = practiceSnapshot.completedScenarioIds.includes(scenario.id);
  const [phase, setPhase] = useState<"ready" | "active" | "complete">("ready");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [goalProgress, setGoalProgress] = useState(0);
  const [lastResponse, setLastResponse] = useState<PracticeTurnResponse | null>(
    null,
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [typedReply, setTypedReply] = useState("");
  const [inputMode, setInputMode] = useState<"speech" | "text">("speech");
  const [showHints, setShowHints] = useState(false);
  const [showWarmup, setShowWarmup] = useState(false);
  const [translations, setTranslations] = useState<string[]>([]);
  const assisted = useRef(false);
  const submissionLock = useRef(false);
  const pendingTurn = useRef<PendingTurn | null>(null);
  const [hasPendingTurn, setHasPendingTurn] = useState(false);
  const startLock = useRef(false);
  const finishLock = useRef(false);
  const busy = isStarting || isSubmitting || isFinishing;
  const recordingBusy =
    recordingStatus === "starting" || recordingStatus === "stopping";
  const lastMessage = messages.at(-1);
  const returningGreeting = collected && scenario.id === "fika-order";
  const opening = returningGreeting
    ? "Hej igen! Vad är du sugen på idag?"
    : scenario.openingLine;
  const openingEnglish = returningGreeting
    ? "Hi again! What are you in the mood for today?"
    : scenario.openingEnglish;
  const earnedStamp = goalProgress >= 1 && turnCount >= scenario.minimumTurns;

  async function beginPractice() {
    if (startLock.current) return;
    startLock.current = true;
    setIsStarting(true);
    setActionError(null);
    try {
      const id = await startPracticeSession({
        languageCode: targetLanguage.code,
        scenarioId: scenario.id,
        characterId: scenario.characterId,
        readiness: current.readiness,
        encounteredConceptSlugs: current.encounteredConceptSlugs,
      });
      setActiveRecommendation(current);
      setSessionId(id);
      setTurnCount(0);
      setGoalProgress(0);
      setLastResponse(null);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "character",
          text: opening,
          englishSupport: openingEnglish,
        },
      ]);
      setPhase("active");
      setShowWarmup(false);
      setTranslations([]);
      setTypedReply("");
      pendingTurn.current = null;
      setHasPendingTurn(false);
      resetTranscript();
      playSound("advance");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not start this visit. Try again.",
      );
    } finally {
      startLock.current = false;
      setIsStarting(false);
    }
  }

  async function finishPractice(
    summary: string,
    progress: number,
    turns: number,
  ) {
    if (!sessionId || finishLock.current) return;
    finishLock.current = true;
    setIsFinishing(true);
    setActionError(null);
    try {
      await completePracticeSession({
        sessionId,
        languageCode: targetLanguage.code,
        scenarioId: scenario.id,
        characterId: scenario.characterId,
        turnCount: turns,
        goalProgress: progress,
        summary,
      });
      setPhase("complete");
      playSound("complete");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Your visit could not be saved. Try finishing again.",
      );
    } finally {
      finishLock.current = false;
      setIsFinishing(false);
    }
  }

  async function savePendingTurn() {
    const pending = pendingTurn.current;
    if (!pending || !sessionId) return;
    const { body, text, speech } = pending;
    await recordPracticeTurn({
      sessionId,
      languageCode: targetLanguage.code,
      scenarioId: scenario.id,
      characterId: scenario.characterId,
      position: turnCount,
      resolution: body.resolution,
      alternatives: speech?.alternatives ?? [],
      replyText: body.reply,
      meaningScore: body.meaningScore,
      grammarScore: body.grammarScore,
      vocabularyScore: body.vocabularyScore,
      speechMetrics: {
        durationMs: speech?.durationMs ?? 0,
        accuracyScore:
          speech && speech.accuracyScore > 0 ? speech.accuracyScore : null,
        fluencyScore:
          speech && speech.fluencyScore > 0 ? speech.fluencyScore : null,
        completenessScore:
          speech && speech.completenessScore > 0
            ? speech.completenessScore
            : null,
        pronunciationScore:
          speech && speech.pronunciationScore > 0
            ? speech.pronunciationScore
            : null,
      },
      // Typed and supported turns are useful practice, not independent spoken-recall evidence.
      evidence: speech && !pending.assisted ? body.evidence : [],
      memories: body.memories,
    });
    pendingTurn.current = null;
    setHasPendingTurn(false);
    const turns = turnCount + 1;
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: "learner", text },
      {
        id: crypto.randomUUID(),
        role: "character",
        text: body.reply,
        englishSupport: body.englishSupport,
      },
    ]);
    setTurnCount(turns);
    setGoalProgress(body.goalProgress);
    setLastResponse(body);
    setTypedReply("");
    resetTranscript();
    if (body.complete)
      await finishPractice(body.continuityNote, body.goalProgress, turns);
    else if (body.meaningScore >= 0.7) playSound("correct");
  }

  async function submitTurn(text: string, speech?: TargetSpeechResult) {
    if (
      !sessionId ||
      submissionLock.current ||
      finishLock.current ||
      !text.trim()
    )
      return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (!pendingTurn.current) {
        const response = await fetch("/api/practice/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            languageCode: targetLanguage.code,
            scenarioId: scenario.id,
            turnIndex: turnCount,
            transcript: text.trim(),
            alternatives: speech?.alternatives ?? [],
            inputMode: speech ? "speech" : "text",
            history: messages
              .slice(-12)
              .map(({ role, text }) => ({ role, text })),
            encounteredConceptSlugs: current.encounteredConceptSlugs,
            memories: practiceSnapshot.memories
              .slice(0, 30)
              .map(({ label, value, category }) => ({
                label,
                value,
                category,
              })),
            continuitySummary: continuity?.summary ?? null,
          }),
        });
        const body = (await response.json()) as PracticeTurnResponse & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(
            body.error ?? "The conversation paused. Please try again.",
          );
        pendingTurn.current = {
          body,
          text,
          speech,
          assisted: assisted.current,
        };
        setHasPendingTurn(true);
      }
      await savePendingTurn();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not save that reply. Please try again.",
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleMicrophone() {
    if (busy || recordingBusy) return;
    if (isRecording) {
      stop();
      return;
    }
    setActionError(null);
    try {
      const speech = await start({ mode: "open" });
      await submitTurn(speech.recognizedText, speech);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not hear you. Try again, or type your reply.",
      );
    }
  }
  function markAssisted() {
    assisted.current = true;
  }
  const nextQuest = townQuests.find(
    (item) =>
      item.id !== scenario.id &&
      !practiceSnapshot.completedScenarioIds.includes(item.id),
  );
  const error = actionError ?? modelError;

  if (isLoading)
    return (
      <div className="life-loading" role="status">
        Getting your visit ready…
      </div>
    );
  if (phase === "complete")
    return (
      <div className="life-visit-complete">
        <div className="life-complete-decoration">
          <Sparkles size={28} />
        </div>
        <p className="life-eyebrow">
          {earnedStamp && quest
            ? "A memory for your journal"
            : "A little more Swedish, every time"}
        </p>
        <h1>{earnedStamp && quest ? quest.stamp : "See you around."}</h1>
        {earnedStamp && quest ? (
          <div className="life-stamp is-earned">
            <Check size={35} />
            <span>Lindbacken</span>
          </div>
        ) : null}
        <p>
          {lastResponse?.feedback ??
            `You spent ${turnCount} ${turnCount === 1 ? "turn" : "turns"} with ${character.name}.`}
        </p>
        {!earnedStamp && quest ? (
          <p className="life-muted">
            Your practice is saved. Finish this adventure to collect its stamp.
          </p>
        ) : null}
        <div className="life-complete-actions">
          {onReturnToWorld ? (
            <button
              className="life-button"
              type="button"
              onClick={onReturnToWorld}
            >
              Back to town
              <ArrowRight size={17} />
            </button>
          ) : (
            <Link className="life-button" href={quest ? "/practice" : "/learn"}>
              {quest ? "Back to Lindbacken" : "Back to Learn"}
              <ArrowRight size={17} />
            </Link>
          )}
          {quest ? (
            <Link className="life-button life-button-outline" href="/progress">
              <BookOpen size={17} />
              My journal
            </Link>
          ) : null}
        </div>
        {quest && nextQuest ? (
          <Link
            className="life-next-memory"
            href={`/practice?scene=${nextQuest.id}`}
          >
            Your next little adventure
            <strong>
              {nextQuest.title}
              <ArrowRight size={17} />
            </strong>
          </Link>
        ) : null}
        {lastResponse?.resolution.surfaceAfterSession &&
        lastResponse.resolution.invisibleNote ? (
          <details className="life-learning-details">
            <summary>A speech detail</summary>
            <p>{lastResponse.resolution.invisibleNote}</p>
          </details>
        ) : null}
      </div>
    );

  return (
    <div className="life-visit">
      <div className="life-page-heading">
        <div>
          <p className="life-eyebrow">
            {quest?.subtitle ?? targetLanguage.name}
            <span>·</span>
            {collected ? "Welcome back" : "Make a new memory"}
          </p>
          <h1>
            {quest ? (collected ? quest.next : quest.title) : scenario.title}
          </h1>
        </div>
        {phase === "active" ? (
          <span className="life-turn-count">
            {turnCount} {turnCount === 1 ? "reply" : "replies"}
            <span className="life-mini-track">
              <span
                style={{ width: `${Math.min(100, goalProgress * 100)}%` }}
              />
            </span>
          </span>
        ) : (
          <span className="life-visit-duration">
            A short visit with {character.name}
          </span>
        )}
      </div>
      <div className="life-visit-layout">
        <section
          className="life-conversation"
          aria-label={`Conversation with ${character.name}`}
        >
          {targetLanguage.code === "sv" ? (
            <PracticeRoom
              sceneId={scenario.id}
              name={character.name}
              dialogue={
                phase === "active" ? (lastMessage?.text ?? opening) : opening
              }
              english={
                phase === "active"
                  ? (lastMessage?.englishSupport ?? openingEnglish)
                  : openingEnglish
              }
              translationVisible={translations.includes(
                lastMessage?.id ?? "opening",
              )}
              onTranslate={() => {
                setTranslations([
                  ...translations,
                  lastMessage?.id ?? "opening",
                ]);
                markAssisted();
              }}
              onHint={markAssisted}
              busy={busy || isRecording || recordingBusy}
            />
          ) : (
            <div className="life-simple-dialogue">
              <MessageCircle size={32} />
              <h2>{character.name}</h2>
              <p>{lastMessage?.text ?? opening}</p>
              <small>{lastMessage?.englishSupport ?? openingEnglish}</small>
            </div>
          )}
          <div className="life-conversation-controls">
            {error ? (
              <p className="life-error" role="alert">
                {error}
              </p>
            ) : null}
            {phase === "ready" ? (
              <>
                <div className="life-goal-label">
                  <span>YOUR LITTLE MISSION</span>
                  <p>{scenario.goal}</p>
                </div>
                <div className="life-start-actions">
                  <button
                    className="life-button"
                    type="button"
                    disabled={busy}
                    onClick={() => void beginPractice()}
                  >
                    {isStarting ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <MessageCircle size={18} />
                    )}
                    Start with {character.name}
                    <ArrowRight size={18} />
                  </button>
                  {quest ? (
                    <button
                      type="button"
                      className="life-button life-button-outline"
                      onClick={() => {
                        setShowWarmup(!showWarmup);
                        markAssisted();
                      }}
                      aria-expanded={showWarmup}
                    >
                      Warm up first
                    </button>
                  ) : null}
                </div>
                {showWarmup ? (
                  <PhraseWarmup
                    key={scenario.id}
                    scenarioId={scenario.id}
                    onReady={() => void beginPractice()}
                  />
                ) : null}
              </>
            ) : (
              <>
                {messages.length > 1 ? (
                  <details className="life-transcript">
                    <summary>
                      Our conversation
                      <ChevronDown size={15} />
                    </summary>
                    {messages.map((message) => (
                      <p key={message.id}>
                        <strong>
                          {message.role === "learner" ? "You" : character.name}
                        </strong>
                        <span lang={targetLanguage.code}>{message.text}</span>
                      </p>
                    ))}
                  </details>
                ) : null}
                {liveTranscript ? (
                  <p className="life-live-transcript" aria-live="polite">
                    {liveTranscript}
                  </p>
                ) : null}
                {isSubmitting || isFinishing ? (
                  <p className="life-saving" role="status">
                    <LoaderCircle size={16} className="animate-spin" />
                    {isFinishing
                      ? "Saving your visit…"
                      : `${character.name} is listening…`}
                  </p>
                ) : null}
                {hasPendingTurn && !busy ? (
                  <button
                    className="life-button"
                    type="button"
                    onClick={() =>
                      void submitTurn(pendingTurn.current?.text ?? "")
                    }
                  >
                    Retry saving your reply
                  </button>
                ) : lastResponse?.complete ? (
                  <button
                    className="life-button"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void finishPractice(
                        lastResponse.continuityNote,
                        goalProgress,
                        turnCount,
                      )
                    }
                  >
                    Finish saving this visit
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <>
                    <div className="life-input-modes" aria-label="Reply mode">
                      <button
                        type="button"
                        aria-pressed={inputMode === "speech"}
                        disabled={busy || isRecording || recordingBusy}
                        onClick={() => setInputMode("speech")}
                      >
                        <Mic size={15} />
                        Speak
                      </button>
                      <button
                        type="button"
                        aria-pressed={inputMode === "text"}
                        disabled={busy || isRecording || recordingBusy}
                        onClick={() => setInputMode("text")}
                      >
                        <Keyboard size={15} />
                        Type
                      </button>
                    </div>
                    {inputMode === "text" ? (
                      <form
                        className="life-typed-reply"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void submitTurn(typedReply);
                        }}
                      >
                        <label className="sr-only" htmlFor="practice-reply">
                          Your reply in {targetLanguage.name}
                        </label>
                        <input
                          id="practice-reply"
                          autoComplete="off"
                          maxLength={2000}
                          placeholder={`Reply in ${targetLanguage.name}…`}
                          value={typedReply}
                          onChange={(event) =>
                            setTypedReply(event.target.value)
                          }
                          disabled={busy}
                        />
                        <button
                          className="life-button"
                          type="submit"
                          disabled={busy || !typedReply.trim()}
                          aria-label="Send reply"
                        >
                          <Send size={19} />
                        </button>
                      </form>
                    ) : (
                      <button
                        className={`life-button life-microphone ${isRecording ? "is-recording" : ""}`}
                        type="button"
                        disabled={busy || recordingBusy}
                        onClick={() => void handleMicrophone()}
                      >
                        {recordingBusy ? (
                          <LoaderCircle size={19} className="animate-spin" />
                        ) : isRecording ? (
                          <Square size={17} fill="currentColor" />
                        ) : (
                          <Mic size={20} />
                        )}
                        {recordingStatus === "starting"
                          ? "Opening microphone…"
                          : recordingStatus === "stopping"
                            ? "Finishing transcript…"
                            : isRecording
                              ? "Finish speaking"
                              : `Speak to ${character.name}`}
                      </button>
                    )}
                  </>
                )}
                <div className="life-conversation-bottom">
                  <button
                    className="life-text-link"
                    type="button"
                    onClick={() => {
                      setShowHints(!showHints);
                      markAssisted();
                    }}
                    aria-expanded={showHints}
                  >
                    A little help?
                  </button>
                  <button
                    className="life-text-link"
                    type="button"
                    disabled={
                      busy || isRecording || recordingBusy || hasPendingTurn
                    }
                    onClick={() =>
                      void finishPractice(
                        lastResponse?.continuityNote ??
                          `Visited ${scenario.title} for ${turnCount} turns.`,
                        goalProgress,
                        turnCount,
                      )
                    }
                  >
                    Finish this visit
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
        <aside className="life-visit-sidebar">
          <section className="life-mission-note">
            <span className="life-note-pin" />
            <p className="life-eyebrow">A note for you</p>
            <h2>
              {collected
                ? "Make yourself a regular."
                : "Small steps. Real moments."}
            </h2>
            <p>{quest?.description ?? scenario.goal}</p>
            <div className="life-mission-steps">
              <span className={turnCount > 0 ? "is-done" : ""}>
                <Check size={14} />
                Say hello
              </span>
              <span className={earnedStamp ? "is-done" : ""}>
                <Check size={14} />
                {scenario.id === "fika-order"
                  ? "Order and answer a follow-up"
                  : "Complete your little mission"}
              </span>
              <span className={collected ? "is-done" : ""}>
                <BookOpen size={14} />
                {quest ? quest.stamp : "A memory to build on"}
              </span>
            </div>
          </section>
          {showHints || phase === "ready" ? (
            <details
              className="life-hints"
              open={showHints}
              onToggle={(event) => {
                setShowHints(event.currentTarget.open);
                if (event.currentTarget.open) markAssisted();
              }}
            >
              <summary>
                A few useful phrases
                <ChevronDown size={15} />
              </summary>
              {scenario.starterHints.map((hint) => (
                <div key={hint.target}>
                  <strong lang={targetLanguage.code}>{hint.target}</strong>
                  <span>{hint.english}</span>
                </div>
              ))}
            </details>
          ) : null}
          {continuity?.summary ? (
            <details className="life-hints">
              <summary>
                Last time with {character.name}
                <ChevronDown size={15} />
              </summary>
              <p>{continuity.summary}</p>
            </details>
          ) : null}
          {practiceSnapshot.memories.length ? (
            <details className="life-hints">
              <summary>
                What Sapling remembers
                <ChevronDown size={15} />
              </summary>
              {practiceSnapshot.memories.map((memory) => (
                <div className="life-memory" key={memory.id}>
                  <span>
                    <strong>{memory.label}</strong>
                    {memory.value}
                  </span>
                  <button
                    type="button"
                    aria-label={`Forget ${memory.label}`}
                    onClick={() =>
                      void deleteLearnerMemory(memory.id).catch(() =>
                        setActionError(
                          "Could not forget that detail. Try again.",
                        ),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </details>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
