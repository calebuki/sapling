"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Lightbulb, Mic, Snail, Volume2, X } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { chooseNextActivity, type AdaptiveActivity, type SessionAttempt } from "@/lib/learning/adaptive";
import { buildTiles, checkAnswer, expectedFor, meaningOf, type Check as CheckResult } from "@/lib/game/lesson";
import { conceptStage, conceptXp, stageNames, type Stage } from "@/lib/game/progression";
import { ui } from "@/lib/game/ui-text";
import { nudges, pick, praise, roundDone, type Line, type Villager } from "@/lib/game/villagers";
import type { LearnerConceptState } from "@/types/learning";
import { sound } from "../audio/sfx";
import { canRecognizeSpeech, listenSwedish, speakSwedish, stopListening } from "../audio/speech";
import { emote, useGame } from "../store";
import { Sv, SvLine } from "./sv";
import { StageIcon } from "./stage-icon";

const ROUND_LENGTH = 8;

type Outcome = {
  correct: boolean;
  check: CheckResult | "choice" | "ai";
  line: Line;
  expected: string;
  gained: number;
  stageUp: { from: Stage; to: Stage } | null;
};

type RoundSummary = { correct: number; total: number; xp: number; grown: Array<{ text: string; to: Stage }> };

export function LessonRound({
  villager,
  onFinish,
}: {
  villager: Villager;
  onFinish: (summary: RoundSummary) => void;
}) {
  const model = useLearningModel();
  const name = useGame((s) => s.save.name);
  const scoped = useMemo(
    () => model.concepts.filter((c) => c.languageCode === "sv" && villager.conceptSlugs.includes(c.slug)),
    [model.concepts, villager],
  );
  const [attempts, setAttempts] = useState<SessionAttempt[]>([]);
  const [activity, setActivity] = useState<AdaptiveActivity | null>(() =>
    chooseNextActivity({ languageCode: "sv", concepts: scoped, states: model.states }),
  );
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [queued, setQueued] = useState<AdaptiveActivity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const summary = useRef<RoundSummary>({ correct: 0, total: 0, xp: 0, grown: [] });
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(performance.now());


  if (!activity) {
    return (
      <div className="dialogue-actions">
        <button className="btn btn-primary" autoFocus onClick={() => onFinish(summary.current)}>
          <SvLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    );
  }
  const concept = scoped.find((c) => c.id === activity.conceptId)!;
  const stateBefore = model.states.find((s) => s.conceptId === activity.conceptId);

  async function record(params: {
    successful: boolean;
    assisted: boolean;
    response: string;
    expected: string;
    check: Outcome["check"];
    replays: number;
    input: "text" | "speech" | "tiles" | "choice";
  }) {
    if (!activity || busy) return;
    setBusy(true);
    setError(false);
    const encounter = activity.mode === "encounter";
    const dimension = encounter
      ? "exposure"
      : activity.mode === "listen" || activity.mode === "dictation"
        ? "recognitionAudio"
        : activity.mode === "transfer"
          ? "production"
          : "recall";
    let after: LearnerConceptState | undefined;
    try {
      after = await model.recordObservation({
        attemptId: attemptId.current,
        conceptId: activity.conceptId,
        dimension,
        successful: params.successful,
        assisted: params.assisted,
        latencyMs: encounter ? null : Math.round(performance.now() - startedAt.current),
        response: params.response,
        expected: params.expected,
        context: {
          activityId: activity.id,
          mode: activity.mode,
          reason: activity.reason,
          replayCount: params.replays,
          hintUsed: params.assisted,
          villager: villager.id,
          source: "island-game",
          modality: params.input === "speech" ? "speech" : "text",
          input: params.input,
        },
      });
    } catch {
      setError(true);
      setBusy(false);
      return;
    }
    const nextAttempts = [...attempts, { activity, successful: params.successful, assisted: params.assisted }];
    setAttempts(nextAttempts);
    // Plan the next step against the evidence just recorded, not the pre-render model.
    const freshStates = after
      ? [...model.states.filter((s) => s.conceptId !== after!.conceptId), after]
      : model.states;
    const upcoming =
      nextAttempts.length >= ROUND_LENGTH
        ? null
        : chooseNextActivity({ languageCode: "sv", concepts: scoped, states: freshStates, attempts: nextAttempts });
    const gained = Math.max(0, conceptXp(after) - conceptXp(stateBefore));
    const from = conceptStage(stateBefore);
    const to = conceptStage(after);
    const stageUp = to > from ? { from, to } : null;
    if (!encounter) {
      summary.current.total++;
      if (params.successful) summary.current.correct++;
    }
    summary.current.xp += gained;
    if (stageUp) summary.current.grown.push({ text: concept.canonicalForm, to });
    if (encounter) {
      setBusy(false);
      advance(upcoming);
      return;
    }
    setQueued(upcoming);
    if (params.successful) {
      sound.play("correct");
      emote(villager.id, "happy", 1500);
      emote("player", "happy", 1000);
    } else {
      sound.play("wrong");
      emote(villager.id, "think", 1600);
    }
    setOutcome({
      correct: params.successful,
      check: params.check,
      line: params.successful ? pick(praise) : pick(nudges),
      expected: params.expected,
      gained,
      stageUp,
    });
    void speakSwedish(params.expected, { clipId: activity.exercise.audioId, who: villager.id, pitch: villager.voicePitch });
    setBusy(false);
  }

  function advance(next: AdaptiveActivity | null) {
    sound.play("click");
    if (!next) {
      onFinish(summary.current);
      return;
    }
    setOutcome(null);
    attemptId.current = crypto.randomUUID();
    startedAt.current = performance.now();
    setActivity(next);
  }

  return (
    <div className="lesson" aria-busy={busy}>
      <div className="lesson-progress" aria-hidden="true">
        {Array.from({ length: ROUND_LENGTH }, (_, i) => (
          <span key={i} className={i < attempts.length ? "is-done" : i === attempts.length ? "is-current" : ""} />
        ))}
      </div>
      {outcome ? (
        <Feedback outcome={outcome} onNext={() => advance(queued)} />
      ) : (
        <ActivityView
          key={activity.id + attempts.length}
          activity={activity}
          villager={villager}
          name={name}
          state={stateBefore}
          pool={scoped.map((c) => c.canonicalForm)}
          busy={busy}
          onRecord={record}
        />
      )}
      {error ? (
        <p className="lesson-error" role="alert">
          <SvLine line={ui.error} /> <button onClick={() => setError(false)}><SvLine line={ui.tryAgain} /></button>
        </p>
      ) : null}
    </div>
  );
}

function Feedback({ outcome, onNext }: { outcome: Outcome; onNext: () => void }) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus(), []);
  return (
    <div className={`lesson-feedback ${outcome.correct ? "is-correct" : "is-wrong"}`} role="status">
      <div className="lesson-feedback-head">
        <span className="lesson-feedback-icon">{outcome.correct ? <Check size={22} /> : <X size={22} />}</span>
        <SvLine line={outcome.line} as="strong" />
        {outcome.correct && outcome.gained > 0 ? <span className="xp-pop">+{outcome.gained}</span> : null}
      </div>
      <p className="lesson-answer">
        <Sv text={outcome.expected} />
        <button className="icon-button" aria-label="Lyssna igen (listen again)" onClick={() => void speakSwedish(outcome.expected)}>
          <Volume2 size={18} />
        </button>
      </p>
      {outcome.check === "accent" || outcome.check === "typo" ? (
        <p className="lesson-note">
          <Sv text="Titta på stavningen!" en="Look at the spelling!" />
        </p>
      ) : null}
      {outcome.stageUp ? (
        <p className="lesson-grow">
          <StageIcon stage={outcome.stageUp.to} />
          <Sv text={`Ditt ord växer: ${stageNames[outcome.stageUp.to].sv}!`} en={`Your word grows: ${stageNames[outcome.stageUp.to].en}!`} />
        </p>
      ) : null}
      <div className="dialogue-actions">
        <button ref={next} className="btn btn-primary" onClick={onNext}>
          <SvLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function shuffled<T>(items: readonly T[], key: string) {
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  return items
    .map((item, i) => ({ item, k: Math.sin(seed + i * 12.9898) * 43758.5453 % 1 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

export type RecordFn = (p: {
  successful: boolean;
  assisted: boolean;
  response: string;
  expected: string;
  check: Outcome["check"];
  replays: number;
  input: "text" | "speech" | "tiles" | "choice";
}) => Promise<void>;

export function ActivityView({
  activity,
  villager,
  name,
  state,
  pool,
  busy,
  onRecord,
}: {
  activity: AdaptiveActivity;
  villager: Villager;
  name: string | null;
  state: LearnerConceptState | undefined;
  pool: string[];
  busy: boolean;
  onRecord: RecordFn;
}) {
  const exercise = activity.exercise;
  const expected = expectedFor(exercise, name);
  const meaning = meaningOf(exercise, name);
  const listening = activity.listening;
  const [replays, setReplays] = useState(0);
  const voice = { clipId: exercise.audioId, who: villager.id, pitch: villager.voicePitch } as const;

  const play = (slow = false) => {
    setReplays((r) => r + 1);
    if (activity.mode === "listen" || activity.mode === "dictation") {
      return speakSwedish(listening!.text, { clipId: listening!.audioId, who: villager.id, pitch: villager.voicePitch, slow });
    }
    return speakSwedish(expected, { ...voice, slow });
  };

  useEffect(() => {
    if (activity.mode === "encounter" || activity.mode === "listen" || activity.mode === "dictation") {
      const timer = window.setTimeout(() => void play(), 350);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  const listenButtons = (
    <div className="listen-buttons">
      <button className="icon-button big" aria-label="Lyssna (listen)" onClick={() => void play()}>
        <Volume2 size={22} />
      </button>
      <button className="icon-button" aria-label="Långsamt (slowly)" onClick={() => void play(true)}>
        <Snail size={18} />
      </button>
    </div>
  );

  if (activity.mode === "encounter") {
    return (
      <div className="activity">
        <p className="activity-kicker">
          <SvLine line={ui.newPhrase} />
        </p>
        <div className="activity-phrase">
          <Sv text={expected} en={meaning} as="h3" />
          {listenButtons}
        </div>
        <p className="activity-meaning">{meaning}</p>
        <SayItPractice expected={expected} />
        <div className="dialogue-actions">
          <button
            className="btn btn-primary"
            disabled={busy}
            autoFocus
            onClick={() => void onRecord({ successful: true, assisted: true, response: "", expected, check: "exact", replays, input: "text" })}
          >
            <SvLine line={ui.next} /> <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (activity.mode === "listen" && listening) {
    const options = shuffled(listening.options, activity.id);
    return (
      <div className="activity">
        <p className="activity-kicker">
          <SvLine line={ui.whatDoesItMean} />
        </p>
        <div className="activity-phrase is-hidden">{listenButtons}</div>
        <div className="choice-grid">
          {options.map((option) => (
            <button
              key={option}
              className="btn choice"
              disabled={busy}
              onClick={() =>
                void onRecord({
                  successful: option === listening.meaning,
                  assisted: false,
                  response: option,
                  expected: listening.text,
                  check: "choice",
                  replays: Math.max(0, replays - 1),
                  input: "choice",
                })
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activity.mode === "dictation" && listening) {
    return (
      <div className="activity">
        <p className="activity-kicker">
          <SvLine line={ui.whatDidYouHear} />
        </p>
        <div className="activity-phrase is-hidden">{listenButtons}</div>
        <FreeAnswer
          busy={busy}
          onSubmit={(answer, via, hinted) => {
            const check = checkAnswer(answer, listening.text);
            return onRecord({ successful: check !== "wrong", assisted: hinted, response: answer, expected: listening.text, check, replays: Math.max(0, replays - 1), input: via });
          }}
          hint={listening.text}
        />
      </div>
    );
  }

  // Recall and transfer: produce the Swedish for an English meaning.
  const useTiles = activity.mode === "recall" && (state?.recall ?? null) === null;
  // Open prompts describe a task ("Order any drink."); others show the meaning to produce.
  const prompt = exercise.mode === "open" ? exercise.prompt : meaning;
  return (
    <div className="activity">
      <p className="activity-kicker">
        <SvLine line={useTiles ? ui.buildSentence : ui.sayInSwedish} />
      </p>
      <h3 className="activity-prompt">“{prompt}”</h3>
      {useTiles ? (
        <Tiles
          expected={expected}
          pool={pool}
          busy={busy}
          onSubmit={(answer) => {
            const check = checkAnswer(answer, expected);
            return onRecord({ successful: check !== "wrong", assisted: false, response: answer, expected, check, replays: 0, input: "tiles" });
          }}
        />
      ) : (
        <FreeAnswer
          busy={busy}
          hint={expected}
          onSubmit={async (answer, via, hinted) => {
            let check: Outcome["check"] = checkAnswer(answer, expected);
            let successful = check !== "wrong";
            // Open prompts accept any natural answer through the constrained evaluator.
            if (!successful && exercise.mode !== "repeat" && answer.trim()) {
              try {
                const response = await fetch("/api/learning/evaluate-answer", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ languageCode: "sv", lessonId: activity.lessonId, exerciseId: exercise.audioId, transcript: answer, alternatives: [] }),
                });
                if (response.ok) {
                  const result = await response.json();
                  if (result.successful === true) {
                    successful = true;
                    check = "ai";
                  }
                }
              } catch {}
            }
            return onRecord({ successful, assisted: hinted, response: answer, expected, check, replays: 0, input: via });
          }}
        />
      )}
    </div>
  );
}

function Tiles({ expected, pool, busy, onSubmit }: { expected: string; pool: string[]; busy: boolean; onSubmit: (answer: string) => Promise<void> }) {
  const tiles = useMemo(() => buildTiles(expected, pool, expected.length * 7919), [expected, pool]);
  const [chosen, setChosen] = useState<string[]>([]);
  const byId = new Map(tiles.map((t) => [t.id, t]));
  const answer = chosen.map((id) => byId.get(id)!.word).join(" ");
  return (
    <div className="tiles">
      <div className="tile-answer" aria-live="polite">
        {chosen.length === 0 ? <span className="tile-placeholder">…</span> : null}
        {chosen.map((id) => (
          <button key={id} className="tile is-placed" onClick={() => { sound.play("tile"); setChosen((c) => c.filter((x) => x !== id)); }}>
            {byId.get(id)!.word}
          </button>
        ))}
      </div>
      <div className="tile-bank">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            className="tile"
            disabled={chosen.includes(tile.id)}
            onClick={() => {
              sound.play("tile");
              setChosen((c) => [...c, tile.id]);
            }}
          >
            {tile.word}
          </button>
        ))}
      </div>
      <div className="dialogue-actions">
        <button className="btn btn-primary" disabled={busy || chosen.length === 0} onClick={() => void onSubmit(answer)}>
          <Check size={18} /> <SvLine line={ui.check} />
        </button>
      </div>
    </div>
  );
}

function FreeAnswer({
  busy,
  hint,
  onSubmit,
}: {
  busy: boolean;
  hint: string;
  onSubmit: (answer: string, via: "text" | "speech", hinted: boolean) => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  const [hinted, setHinted] = useState(false);
  const [listening, setListening] = useState(false);
  const [via, setVia] = useState<"text" | "speech">("text");
  const input = useRef<HTMLInputElement>(null);
  const micSupported = useMemo(() => canRecognizeSpeech(), []);
  useEffect(() => input.current?.focus(), []);

  const insert = (letter: string) => {
    const el = input.current;
    const start = el?.selectionStart ?? answer.length;
    const end = el?.selectionEnd ?? answer.length;
    setAnswer(answer.slice(0, start) + letter + answer.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + 1, start + 1);
    });
  };

  async function speak() {
    if (listening) {
      stopListening();
      return;
    }
    setListening(true);
    sound.play("pop");
    try {
      const result = await listenSwedish((text) => setAnswer(text));
      if (result.transcript) {
        setAnswer(result.transcript);
        setVia("speech");
      }
    } catch {
      // Permission denied or no speech; typing still works.
    } finally {
      setListening(false);
    }
  }

  return (
    <form
      className="free-answer"
      onSubmit={(e) => {
        e.preventDefault();
        if (!answer.trim() || busy) return;
        void onSubmit(answer, via, hinted);
      }}
    >
      <div className="answer-row">
        <input
          ref={input}
          lang="sv"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setVia("text");
          }}
          placeholder={ui.writeSwedish.sv}
          aria-label="Skriv på svenska (write in Swedish)"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {micSupported ? (
          <button type="button" className={`icon-button mic ${listening ? "is-live" : ""}`} aria-label="Säg det (say it)" onClick={() => void speak()}>
            <Mic size={20} />
          </button>
        ) : null}
      </div>
      <div className="letter-keys" aria-label="Svenska bokstäver (Swedish letters)">
        {["å", "ä", "ö"].map((letter) => (
          <button type="button" key={letter} onClick={() => insert(letter)}>
            {letter}
          </button>
        ))}
      </div>
      {hinted ? (
        <p className="hint-reveal">
          <Sv text={hint} />
        </p>
      ) : null}
      <div className="dialogue-actions">
        <button type="submit" className="btn btn-primary" disabled={busy || !answer.trim()}>
          <Check size={18} /> <SvLine line={ui.check} />
        </button>
        {!hinted ? (
          <button type="button" className="btn" onClick={() => setHinted(true)}>
            <Lightbulb size={17} /> <SvLine line={ui.hint} />
          </button>
        ) : null}
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => void onSubmit(answer || "…", via, true)}>
          <SvLine line={ui.dontKnow} />
        </button>
      </div>
    </form>
  );
}

// Optional pronunciation play: say the new phrase and see what was heard.
function SayItPractice({ expected }: { expected: string }) {
  const [heard, setHeard] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const supported = useMemo(() => canRecognizeSpeech(), []);
  if (!supported) return null;
  const match = heard ? checkAnswer(heard, expected) !== "wrong" : false;
  return (
    <div className="say-it">
      <button
        className={`btn ${listening ? "is-live" : ""}`}
        onClick={async () => {
          if (listening) return stopListening();
          setListening(true);
          sound.play("pop");
          try {
            const result = await listenSwedish((t) => setHeard(t));
            setHeard(result.transcript || null);
            if (result.transcript && checkAnswer(result.transcript, expected) !== "wrong") sound.play("sparkle");
          } catch {
            setHeard(null);
          } finally {
            setListening(false);
          }
        }}
      >
        <Mic size={17} /> <SvLine line={listening ? ui.listening : ui.repeatAfterMe} />
      </button>
      {heard ? (
        <span className={`say-it-heard ${match ? "is-match" : ""}`}>
          <SvLine line={ui.heardYou} />: <Sv text={heard} /> {match ? "✓" : ""}
        </span>
      ) : null}
    </div>
  );
}

export function RoundSummaryView({
  summary,
  villager,
  onAgain,
  onBye,
  extra,
}: {
  summary: RoundSummary;
  villager: Villager;
  onAgain: () => void;
  onBye: () => void;
  extra?: React.ReactNode;
}) {
  const line = useMemo(() => pick(roundDone), []);
  useEffect(() => {
    sound.play("sparkle");
    emote(villager.id, "happy", 1600);
  }, [villager.id]);
  return (
    <div className="round-summary">
      <SvLine line={line} as="h3" />
      <div className="summary-stats">
        <div>
          <strong>
            {summary.correct}/{summary.total}
          </strong>
          <Sv text="rätt" en="correct" />
        </div>
        <div>
          <strong>+{summary.xp}</strong>
          <SvLine line={ui.xpGained} />
        </div>
      </div>
      {summary.grown.length ? (
        <ul className="summary-grown">
          {summary.grown.map((g) => (
            <li key={g.text}>
              <StageIcon stage={g.to} /> <Sv text={g.text} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="dialogue-actions">
        <button className="btn btn-primary" onClick={onAgain} autoFocus>
          <SvLine line={ui.again} />
        </button>
        {extra}
        <button className="btn btn-quiet" onClick={onBye}>
          <SvLine line={ui.bye} />
        </button>
      </div>
    </div>
  );
}

export type { RoundSummary };
