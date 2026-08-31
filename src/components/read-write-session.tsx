"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  PenLine,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLearningModel } from "@/components/providers/learning-model-provider";
import {
  readingPracticeItems,
  type ReadingPracticeItem,
  type TextPracticeItem,
  type WritingPracticeItem,
  writingPracticeItems,
} from "@/lib/learning/text-practice";
import type { LessonEvaluation } from "@/types/lesson-evaluation";
import type { Concept, LearnerConceptState } from "@/types/learning";

type Phase = "attempt" | "feedback" | "repair" | "complete";
type SessionItem = TextPracticeItem & { conceptId: string };
type ReadingFeedback = {
  kind: "reading";
  successful: boolean;
  selectedAnswer: string;
};
type WritingFeedback = {
  kind: "writing";
  response: string;
  evaluation: LessonEvaluation;
};
type Feedback = ReadingFeedback | WritingFeedback;

const ITEMS_PER_KIND = 5;
const sessionRoundStorageKey = "sapling.read-write.round.v1";

function getNextRound() {
  try {
    const current = Number.parseInt(
      window.localStorage.getItem(sessionRoundStorageKey) ?? "0",
      10,
    );
    const next = Number.isFinite(current) ? current + 1 : 1;
    window.localStorage.setItem(sessionRoundStorageKey, String(next));
    return next;
  } catch {
    return 0;
  }
}

function skillEstimate(item: TextPracticeItem, state?: LearnerConceptState) {
  if (item.kind === "reading") {
    return state?.recognitionText ?? 0;
  }

  return ((state?.recall ?? 0) + (state?.production ?? 0)) / 2;
}

function selectItems<T extends TextPracticeItem>(
  items: T[],
  conceptsBySlug: Map<string, Concept>,
  statesByConcept: Map<string, LearnerConceptState>,
  round: number,
) {
  return items
    .flatMap((item, index) => {
      const concept = conceptsBySlug.get(item.conceptSlug);
      return concept
        ? [
            {
              item,
              conceptId: concept.id,
              estimate: skillEstimate(item, statesByConcept.get(concept.id)),
              rotation: (index - round + items.length) % items.length,
            },
          ]
        : [];
    })
    .sort(
      (left, right) =>
        left.estimate - right.estimate || left.rotation - right.rotation,
    )
    .slice(0, ITEMS_PER_KIND)
    .map(({ item, conceptId }) => ({ ...item, conceptId }));
}

function buildSession(
  concepts: Concept[],
  states: LearnerConceptState[],
  round: number,
) {
  const conceptsBySlug = new Map(
    concepts.map((concept) => [concept.slug, concept]),
  );
  const statesByConcept = new Map(
    states.map((state) => [state.conceptId, state]),
  );
  const reading = selectItems(
    readingPracticeItems,
    conceptsBySlug,
    statesByConcept,
    round,
  );
  const writing = selectItems(
    writingPracticeItems,
    conceptsBySlug,
    statesByConcept,
    round,
  );

  return Array.from({ length: ITEMS_PER_KIND }, (_, index) => [
    reading[index],
    writing[index],
  ]).flatMap((pair) => pair.filter((item): item is SessionItem => Boolean(item)));
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("da")
    .replaceAll("ae", "æ")
    .replaceAll("oe", "ø")
    .replaceAll("aa", "å")
    .replace(/[^a-zæøå0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ReadWriteSession() {
  const {
    concepts,
    states,
    isLoading,
    error: modelError,
    recordReadingAttempt,
    recordRepair,
    recordRetrievalAttempt,
  } = useLearningModel();
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [itemIndex, setItemIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("attempt");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [writingResponse, setWritingResponse] = useState("");
  const [repairResponse, setRepairResponse] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [readingCorrect, setReadingCorrect] = useState(0);
  const [writingSuccessful, setWritingSuccessful] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const didPrepareSession = useRef(false);
  const startedAt = useRef<number | null>(null);
  const writingInput = useRef<HTMLTextAreaElement>(null);

  const prepareSession = useCallback(
    () => buildSession(concepts, states, getNextRound()),
    [concepts, states],
  );

  useEffect(() => {
    if (isLoading || didPrepareSession.current) {
      return;
    }

    didPrepareSession.current = true;
    setSessionItems(prepareSession());
  }, [isLoading, prepareSession]);

  const item = sessionItems[itemIndex];

  useEffect(() => {
    if (item && phase === "attempt") {
      startedAt.current = performance.now();
    }
  }, [item, phase]);

  const progress = useMemo(
    () =>
      sessionItems.length === 0
        ? 0
        : ((itemIndex + (phase === "attempt" ? 0 : 0.55)) /
            sessionItems.length) *
          100,
    [itemIndex, phase, sessionItems.length],
  );

  function resetItem() {
    setPhase("attempt");
    setSelectedAnswer("");
    setWritingResponse("");
    setRepairResponse("");
    setFeedback(null);
    setActionError(null);
    startedAt.current = null;
  }

  function moveForward() {
    if (itemIndex === sessionItems.length - 1) {
      setPhase("complete");
      return;
    }

    setItemIndex((current) => current + 1);
    resetItem();
  }

  function practiceAgain() {
    setSessionItems(prepareSession());
    setItemIndex(0);
    setReadingCorrect(0);
    setWritingSuccessful(0);
    resetItem();
  }

  async function submitReading() {
    if (!item || item.kind !== "reading" || !selectedAnswer || isSaving) {
      return;
    }

    const successful = selectedAnswer === item.answer;
    const latencyMs = Math.max(
      0,
      Math.round(performance.now() - (startedAt.current ?? performance.now())),
    );
    setIsSaving(true);
    setActionError(null);

    try {
      await recordReadingAttempt({
        conceptId: item.conceptId,
        questionId: item.id,
        selectedAnswer,
        expectedAnswer: item.answer,
        successful,
        score: successful ? 1 : 0,
        latencyMs,
        context: {
          source: "read-write",
          activityType: "reading-comprehension",
          setting: item.setting,
        },
      });
      if (successful) {
        setReadingCorrect((current) => current + 1);
      }
      setFeedback({ kind: "reading", successful, selectedAnswer });
      setPhase("feedback");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "This reading answer could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitWriting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !item ||
      item.kind !== "writing" ||
      !writingResponse.trim() ||
      isSaving
    ) {
      return;
    }

    const response = writingResponse.trim();
    const latencyMs = Math.max(
      0,
      Math.round(performance.now() - (startedAt.current ?? performance.now())),
    );
    setIsSaving(true);
    setActionError(null);

    try {
      const evaluationResponse = await fetch(
        "/api/learning/evaluate-writing",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseId: item.id, response }),
        },
      );
      const body = (await evaluationResponse.json()) as
        | LessonEvaluation
        | { error?: string };

      if (!evaluationResponse.ok || !("successful" in body)) {
        throw new Error(
          "error" in body && body.error
            ? body.error
            : "Sapling couldn’t check that answer.",
        );
      }

      await recordRetrievalAttempt({
        conceptId: item.conceptId,
        responseText: response,
        expectedResponse: item.exampleAnswer,
        successful: body.successful,
        latencyMs,
        context: {
          source: "read-write",
          activityType: "writing",
          responseMode: "text",
          setting: item.setting,
          evaluationProvider: body.source,
          meaningScore: body.meaningScore,
          grammarScore: body.grammarScore,
          vocabularyScore: body.vocabularyScore,
        },
      });

      if (body.successful) {
        setWritingSuccessful((current) => current + 1);
      }
      setFeedback({ kind: "writing", response, evaluation: body });
      setPhase("feedback");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Sapling couldn’t check that answer.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitRepair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !item ||
      item.kind !== "writing" ||
      !feedback ||
      feedback.kind !== "writing" ||
      !repairResponse.trim() ||
      isSaving
    ) {
      return;
    }

    if (normalize(repairResponse) !== normalize(feedback.evaluation.correctedTargetText)) {
      setActionError("Write the corrected Danish once before continuing.");
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      await recordRepair({
        conceptId: item.conceptId,
        responseText: repairResponse.trim(),
        targetText: feedback.evaluation.correctedTargetText,
        context: {
          source: "read-write",
          activityType: "writing-repair",
          exerciseId: item.id,
        },
      });
      moveForward();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "This correction could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function insertCharacter(character: string) {
    const input = writingInput.current;
    const start = input?.selectionStart ?? writingResponse.length;
    const end = input?.selectionEnd ?? writingResponse.length;
    const next =
      writingResponse.slice(0, start) +
      character +
      writingResponse.slice(end);
    setWritingResponse(next);

    requestAnimationFrame(() => {
      writingInput.current?.focus();
      writingInput.current?.setSelectionRange(start + 1, start + 1);
    });
  }

  if (isLoading || sessionItems.length === 0) {
    return (
      <div className="paper-panel grid min-h-[430px] animate-pulse place-items-center rounded-[30px] p-8 text-sm text-forest-900/50">
        Preparing your text practice…
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="paper-panel soft-enter rounded-[30px] p-7 sm:p-10">
        <div className="grid size-14 place-items-center rounded-2xl bg-moss-400/20 text-forest-800">
          <Sparkles aria-hidden="true" size={25} />
        </div>
        <h2 className="mt-8 font-display text-4xl leading-tight text-forest-950 sm:text-5xl">
          Ten ideas, read and written.
        </h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] bg-white/55 p-5">
            <BookOpen className="text-moss-500" aria-hidden="true" size={21} />
            <p className="mt-4 text-3xl font-bold text-forest-950">
              {readingCorrect}/5
            </p>
            <p className="mt-1 text-sm text-forest-900/55">Reading understood</p>
          </div>
          <div className="rounded-[22px] bg-white/55 p-5">
            <PenLine className="text-clay-400" aria-hidden="true" size={21} />
            <p className="mt-4 text-3xl font-bold text-forest-950">
              {writingSuccessful}/5
            </p>
            <p className="mt-1 text-sm text-forest-900/55">Writing on the first try</p>
          </div>
        </div>
        <button
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
          onClick={practiceAgain}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={17} />
          Practice again
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="paper-panel rounded-[30px] p-8">
        <CircleAlert className="text-clay-400" size={24} />
        <h2 className="mt-4 font-display text-3xl">Text practice is updating.</h2>
        <p className="mt-2 text-sm text-forest-900/60">Try again soon.</p>
      </div>
    );
  }

  return (
    <div className="paper-panel soft-enter overflow-hidden rounded-[30px]">
      <div className="border-b border-forest-900/8 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.16em] text-forest-700/65">
          <span>{item.kind === "reading" ? "Read" : "Write"} · {item.setting}</span>
          <span>{itemIndex + 1} of {sessionItems.length}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
          <div
            className="h-full rounded-full bg-moss-500 transition-[width] duration-500"
            style={{ width: `${Math.max(4, progress)}%` }}
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {phase === "attempt" && item.kind === "reading" ? (
          <ReadingAttempt
            item={item}
            isSaving={isSaving}
            onSelect={setSelectedAnswer}
            onSubmit={submitReading}
            selectedAnswer={selectedAnswer}
          />
        ) : null}

        {phase === "attempt" && item.kind === "writing" ? (
          <WritingAttempt
            inputRef={writingInput}
            isSaving={isSaving}
            item={item}
            onChange={setWritingResponse}
            onInsertCharacter={insertCharacter}
            onSubmit={submitWriting}
            response={writingResponse}
          />
        ) : null}

        {phase === "feedback" && feedback?.kind === "reading" && item.kind === "reading" ? (
          <ReadingResult feedback={feedback} item={item} onContinue={moveForward} />
        ) : null}

        {phase === "feedback" && feedback?.kind === "writing" && item.kind === "writing" ? (
          <WritingResult
            feedback={feedback}
            onContinue={moveForward}
            onRepair={() => {
              setActionError(null);
              setPhase("repair");
            }}
          />
        ) : null}

        {phase === "repair" && feedback?.kind === "writing" && item.kind === "writing" ? (
          <RepairAttempt
            correctedTargetText={feedback.evaluation.correctedTargetText}
            isSaving={isSaving}
            onChange={setRepairResponse}
            onSubmit={submitRepair}
            response={repairResponse}
          />
        ) : null}

        {actionError || modelError ? (
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-clay-400/10 p-4 text-sm text-forest-900">
            <CircleAlert className="mt-0.5 shrink-0 text-clay-400" size={16} />
            {actionError ?? modelError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReadingAttempt({
  item,
  selectedAnswer,
  isSaving,
  onSelect,
  onSubmit,
}: {
  item: ReadingPracticeItem;
  selectedAnswer: string;
  isSaving: boolean;
  onSelect: (answer: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="rounded-[24px] border border-forest-900/10 bg-white/55 p-6 sm:p-7">
        <p className="whitespace-pre-line font-display text-3xl leading-[1.35] text-forest-950 sm:text-4xl" lang="da">
          {item.passage}
        </p>
      </div>
      <fieldset className="mt-8">
        <legend className="font-display text-3xl leading-tight text-forest-950 sm:text-4xl">
          {item.question}
        </legend>
        <div className="mt-5 grid gap-3">
          {item.options.map((option) => {
            const selected = selectedAnswer === option;
            return (
              <button
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-base font-semibold transition ${
                  selected
                    ? "border-forest-800 bg-forest-900 text-cream-50"
                    : "border-forest-900/10 bg-white/55 text-forest-950 hover:bg-white"
                }`}
                key={option}
                onClick={() => onSelect(option)}
                type="button"
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${selected ? "border-cream-50/35" : "border-forest-900/18"}`}>
                  {selected ? <Check aria-hidden="true" size={14} /> : null}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!selectedAnswer || isSaving}
        onClick={onSubmit}
        type="button"
      >
        {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <Check aria-hidden="true" size={18} />}
        {isSaving ? "Saving…" : "Check answer"}
      </button>
    </div>
  );
}

function WritingAttempt({
  item,
  response,
  isSaving,
  inputRef,
  onChange,
  onInsertCharacter,
  onSubmit,
}: {
  item: WritingPracticeItem;
  response: string;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onInsertCharacter: (character: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <h2 className="max-w-3xl font-display text-3xl leading-tight text-forest-950 sm:text-4xl lg:text-[44px]">
        {item.prompt}
      </h2>
      <textarea
        aria-label="Your Danish answer"
        autoCapitalize="sentences"
        autoComplete="off"
        className="mt-7 min-h-40 w-full resize-y rounded-[22px] border border-forest-900/12 bg-white/65 p-5 text-xl leading-8 text-forest-950 outline-none transition placeholder:text-forest-900/28 focus:border-moss-500 focus:ring-4 focus:ring-moss-400/10"
        disabled={isSaving}
        lang="da"
        maxLength={1500}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Skriv dit svar…"
        ref={inputRef}
        value={response}
      />
      <div className="mt-3 flex gap-2">
        {["æ", "ø", "å"].map((character) => (
          <button
            className="grid size-10 place-items-center rounded-xl border border-forest-900/10 bg-white/55 text-base font-bold text-forest-900 transition hover:bg-white"
            key={character}
            onClick={() => onInsertCharacter(character)}
            type="button"
          >
            {character}
          </button>
        ))}
      </div>
      <button
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!response.trim() || isSaving}
        type="submit"
      >
        {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <PenLine aria-hidden="true" size={18} />}
        {isSaving ? "Checking…" : "Check writing"}
      </button>
    </form>
  );
}

function ReadingResult({
  item,
  feedback,
  onContinue,
}: {
  item: ReadingPracticeItem;
  feedback: ReadingFeedback;
  onContinue: () => void;
}) {
  return (
    <div className="soft-enter">
      <div className={`grid size-12 place-items-center rounded-2xl ${feedback.successful ? "bg-moss-400/20 text-forest-800" : "bg-clay-400/15 text-clay-400"}`}>
        {feedback.successful ? <CheckCircle2 aria-hidden="true" size={24} /> : <BookOpen aria-hidden="true" size={23} />}
      </div>
      <h2 className="mt-6 font-display text-4xl text-forest-950">
        {feedback.successful ? "That’s it." : item.answer}
      </h2>
      {!feedback.successful ? (
        <p className="mt-3 text-sm text-forest-900/55">
          You chose {feedback.selectedAnswer}.
        </p>
      ) : null}
      <p className="mt-5 max-w-2xl text-lg leading-8 text-forest-900/76">
        {item.explanation}
      </p>
      <button
        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
        onClick={onContinue}
        type="button"
      >
        Continue
        <ArrowRight aria-hidden="true" size={17} />
      </button>
    </div>
  );
}

function WritingResult({
  feedback,
  onContinue,
  onRepair,
}: {
  feedback: WritingFeedback;
  onContinue: () => void;
  onRepair: () => void;
}) {
  const { evaluation } = feedback;
  return (
    <div className="soft-enter">
      <div className={`grid size-12 place-items-center rounded-2xl ${evaluation.successful ? "bg-moss-400/20 text-forest-800" : "bg-clay-400/15 text-clay-400"}`}>
        {evaluation.successful ? <CheckCircle2 aria-hidden="true" size={24} /> : <PenLine aria-hidden="true" size={23} />}
      </div>
      <h2 className="mt-6 font-display text-4xl leading-tight text-forest-950">
        {evaluation.summary}
      </h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] bg-white/55 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">Your answer</p>
          <p className="mt-3 text-lg leading-8 text-forest-950" lang="da">{feedback.response}</p>
        </div>
        <div className="rounded-[22px] bg-moss-400/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">Natural Danish</p>
          <p className="mt-3 text-lg font-semibold leading-8 text-forest-950" lang="da">{evaluation.correctedTargetText}</p>
        </div>
      </div>
      {evaluation.tips.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {evaluation.tips.map((tip) => (
            <li className="rounded-2xl bg-forest-900/[0.055] px-4 py-3 text-sm leading-6 text-forest-900/76" key={`${tip.area}-${tip.message}`}>
              {tip.message}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-800"
        onClick={evaluation.successful ? onContinue : onRepair}
        type="button"
      >
        {evaluation.successful ? "Continue" : "Rewrite it"}
        <ArrowRight aria-hidden="true" size={17} />
      </button>
    </div>
  );
}

function RepairAttempt({
  correctedTargetText,
  response,
  isSaving,
  onChange,
  onSubmit,
}: {
  correctedTargetText: string;
  response: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="soft-enter" onSubmit={onSubmit}>
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-forest-700/65">Write it once</p>
      <h2 className="mt-3 rounded-[22px] bg-moss-400/10 p-5 font-display text-3xl leading-tight text-forest-950 sm:text-4xl" lang="da">
        {correctedTargetText}
      </h2>
      <textarea
        aria-label="Rewrite the corrected Danish"
        autoComplete="off"
        className="mt-5 min-h-32 w-full resize-y rounded-[22px] border border-forest-900/12 bg-white/65 p-5 text-xl leading-8 text-forest-950 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-400/10"
        disabled={isSaving}
        lang="da"
        maxLength={1500}
        onChange={(event) => onChange(event.target.value)}
        value={response}
      />
      <button
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!response.trim() || isSaving}
        type="submit"
      >
        {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <Check aria-hidden="true" size={18} />}
        {isSaving ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
