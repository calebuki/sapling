"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookUser, Flower2, Mic, Send, Snail, Sprout, Stamp, Star, TrainFront, Volume2 } from "lucide-react";
import { checkAnswer, expectedFor, meaningOf, personalize } from "@/lib/game/lesson";
import type { Line } from "@/lib/game/line";
import { acceptsAnswer, nameFrom, nameIn, pickVariant, reactionTo, trackLabel, type SceneBeat } from "@/lib/game/scenes";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import type { AdaptiveActivity } from "@/lib/learning/adaptive";
import { getTargetLanguage } from "@/lib/learning/languages";
import type { LearnerConceptState } from "@/types/learning";
import { sound } from "../audio/sfx";
import { canRecognizeSpeech, listen, speak, stopListening } from "../audio/speech";
import { island, useIsland } from "../island";
import {
  ActivityView,
  Feedback,
  FreeAnswer,
  judgeAnswer,
  SayItPractice,
  Tiles,
  useLessonRound,
  type RecordFn,
  type RoundSummary,
} from "./lesson-round";
import { Glossed, GlossedLine } from "./glossed";

const SCENE_ROUND = 6;

const extras = () => island().sceneExtras;

export function ListenButtons({ onPlay }: { onPlay: (slow: boolean) => void }) {
  const { ui } = useIsland();
  return (
    <div className="listen-buttons">
      <button className="icon-button big" aria-label={aria(ui.listen)} onClick={() => onPlay(false)}>
        <Volume2 size={22} />
      </button>
      <button className="icon-button" aria-label={aria(ui.slowly)} onClick={() => onPlay(true)}>
        <Snail size={18} />
      </button>
    </div>
  );
}

export function RoundProgress({ length, done }: { length: number; done: number }) {
  return (
    <div className="lesson-progress" aria-hidden="true">
      {Array.from({ length }, (_, i) => (
        <span key={i} className={i < done ? "is-done" : i === done ? "is-current" : ""} />
      ))}
    </div>
  );
}

// Hearing a phrase should keep up with saying it: once a phrase has some
// recall evidence but lags on listening, practise it as a listening drill.
function listenWhenHearingLags(activity: AdaptiveActivity | null, states: LearnerConceptState[]) {
  if (!activity || activity.mode !== "recall") return activity;
  const state = states.find((s) => s.conceptId === activity.conceptId);
  const lagging = (state?.recognitionAudio ?? 0) < (state?.recall ?? 0) - 0.15;
  return lagging ? { ...activity, id: activity.id.replace(":recall:", ":listen:"), mode: "listen" as const } : activity;
}


type StageProps = { beat: SceneBeat | null; wins: SceneBeat[]; answered: boolean };

// Most villagers teach through little exchanges: someone says the cue, you
// answer, and they react to what you actually said. The schedule underneath is
// the same adaptive one every lesson uses.
export function SceneRound({ villager, slugs, onFinish }: { villager: Villager; slugs: readonly string[]; onFinish: (summary: RoundSummary) => void }) {
  const { ui } = useIsland();
  const round = useLessonRound(villager, slugs, onFinish, { roundLength: SCENE_ROUND, adapt: listenWhenHearingLags });
  const { activity, concept, name, outcome, queued, busy, attempts, summary, stateBefore } = round;
  const [wins, setWins] = useState<SceneBeat[]>([]);
  // Varies the variants from one round to the next.
  const [seed] = useState(() => Math.floor(Math.random() * 1e6));
  const [answer, setAnswer] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<{ beat: SceneBeat; expected: string } | null>(null);
  const puzzleUsed = useRef(false);
  const beats = island().scenes[villager.id] ?? {};

  if (!activity || !concept) {
    return (
      <div className="dialogue-actions">
        <button className="btn btn-primary" autoFocus onClick={() => onFinish(summary.current)}>
          <GlossedLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Stable for one activity, from its prompt through its feedback.
  const key = `${activity.id}:${attempts.length - (outcome ? 1 : 0)}`;
  const variants = beats[concept.slug] ?? [];
  // A different variant each time the phrase comes round.
  const beat = variants.length ? pickVariant(variants, `${key}:${seed}`) : null;
  const exercise = activity.exercise;
  const expected = beat?.expect ? personalize(beat.expect.t, name) : expectedFor(exercise, name);
  const meaning = beat?.expect ? beat.expect.en : meaningOf(exercise, name);
  const listening = activity.mode === "listen" || activity.mode === "dictation";

  const record: RecordFn = async (p) => {
    setAnswer(p.input === "choice" ? null : p.response);
    await round.record(p);
    if (p.successful && activity.mode !== "encounter" && beat) setWins((w) => [...w, beat]);
  };

  const next = () => {
    setAnswer(null);
    // Once per round, a finished exchange comes back as a puzzle to put in order.
    if (!puzzleUsed.current && beat && !listening && attempts.length >= 3 && outcome?.correct) {
      puzzleUsed.current = true;
      setPuzzle({ beat, expected });
      return;
    }
    round.advance(queued);
  };

  let body: React.ReactNode;
  if (puzzle) {
    body = (
      <DialogPuzzle
        beat={puzzle.beat}
        expected={puzzle.expected}
        villager={villager}
        name={name}
        onDone={() => {
          setPuzzle(null);
          round.advance(queued);
        }}
      />
    );
  } else if (outcome) {
    body = <Feedback outcome={outcome} onNext={next} />;
  } else if (beat && activity.mode === "encounter") {
    body = <MeetBeat key={key} beat={beat} expected={expected} meaning={meaning} busy={busy} onRecord={record} />;
  } else if (activity.mode === "listen" || (activity.mode === "dictation" && !activity.listening)) {
    body = <ListeningDrill key={key} villager={villager} slug={concept.slug} beat={beat} expected={expected} activity={activity} busy={busy} name={name} onRecord={record} />;
  } else if (beat && !listening) {
    body = <ReplyBeat key={key} beat={beat} round={round} expected={expected} meaning={meaning} onRecord={record} />;
  } else {
    body = (
      <ActivityView
        key={key}
        activity={activity}
        villager={villager}
        name={name}
        state={stateBefore}
        pool={round.scoped.map((c) => c.canonicalForm)}
        busy={busy}
        onRecord={record}
      />
    );
  }

  const Stage = { guestbook: DockStage, journey: StationStage, garden: GardenStage, stamps: StampStage }[villager.stage];
  // Listening drills keep the words hidden; the exchange shows for spoken turns only.
  const showBeat = !puzzle && beat && !listening ? beat : null;
  return (
    <div className={`lesson scene scene-${villager.id}`} aria-busy={busy}>
      <RoundProgress length={SCENE_ROUND} done={attempts.length} />
      <Stage beat={puzzle ? null : beat} wins={wins} answered={Boolean(outcome)} />
      {showBeat ? (
        <Exchange key={`exchange:${key}`} villager={villager} beat={showBeat} target={expected} answer={outcome?.correct ? answer : null} name={name} />
      ) : null}
      {body}
      {round.error ? (
        <p className="lesson-error" role="alert">
          <GlossedLine line={ui.error} /> <button onClick={() => round.setError(false)}><GlossedLine line={ui.tryAgain} /></button>
        </p>
      ) : null}
    </div>
  );
}

// ---------- The exchange ----------

type Turn = { role: "character" | "learner"; t: string; en?: string };
type Reply = { reply: string; english: string; followUp: boolean };

function speakerOf(beat: SceneBeat, answered: boolean) {
  return beat.speaker === "?" ? (answered && beat.guest ? beat.guest : "?") : beat.speaker;
}

function speakAs(beat: SceneBeat, villager: Villager, text: string, slow = false) {
  const self = beat.speaker === villager.name;
  return speak(text, { who: self ? villager.id : undefined, pitch: beat.pitch ?? villager.voicePitch, slow });
}

async function askForReply(body: object): Promise<Reply | null> {
  try {
    const response = await fetch("/api/scene/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: island().code, ...body }) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

// The cue, then (once answered) what the learner said and a reply that fits it.
// Where the reply service is available the character answers in their own
// words and may ask a follow-up the learner can answer freely; otherwise the
// scripted reaction still follows what was said.
export function Exchange({
  villager,
  beat,
  target,
  answer,
  name,
}: {
  villager: Villager;
  beat: SceneBeat;
  target: string;
  answer: string | null;
  name: string | null;
}) {
  // Fast talk is a blur until the learner has asked for help.
  const blurred = beat.fast && !answer;
  const speaker = speakerOf(beat, Boolean(answer));
  const accent = beat.speaker === villager.name ? villager.look.accent : undefined;

  useEffect(() => {
    const timer = window.setTimeout(() => void speakAs(beat, villager, beat.cue.t), 300);
    return () => window.clearTimeout(timer);
  }, [beat, villager]);

  return (
    <div className="scene-thread">
      <Bubble speaker={speaker} accent={accent} line={beat.cue} blurred={blurred} onPlay={() => void speakAs(beat, villager, beat.cue.t)} />
      {answer ? (
        <Continuation key={answer} villager={villager} beat={beat} target={target} answer={answer} name={name} speaker={speaker} accent={accent} />
      ) : null}
    </div>
  );
}

// Everything after the learner's answer: their line, the reply, optional follow-ups.
function Continuation({
  villager,
  beat,
  target,
  answer,
  name,
  speaker,
  accent,
}: {
  villager: Villager;
  beat: SceneBeat;
  target: string;
  answer: string;
  name: string | null;
  speaker: string;
  accent?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>(() => [{ role: "learner", t: answer }]);
  const [thinking, setThinking] = useState(true);
  const [followUp, setFollowUp] = useState(false);
  const learnerName = nameFrom(answer, extras(), island().code) || name || null;

  const request = useCallback(
    (history: Turn[]) =>
      askForReply({
        villager: villager.id,
        speaker,
        situation: beat.situation,
        target,
        learnerName,
        history: [{ role: "character", text: beat.cue.t }, ...history.map((t) => ({ role: t.role, text: t.t }))],
      }),
    [beat.situation, beat.cue.t, villager.id, speaker, target, learnerName],
  );

  // First reply: the model's if it arrives quickly, else the scripted one for what was said.
  useEffect(() => {
    let alive = true;
    const settle = (result: Reply | null) => {
      if (!alive) return;
      alive = false;
      window.clearTimeout(fallback);
      const line = result ? { t: result.reply, en: result.english } : reactionTo(beat, answer, learnerName ?? "", extras(), island().code);
      setThinking(false);
      setTurns([{ role: "learner", t: answer }, { role: "character", ...line }]);
      setFollowUp(Boolean(result?.followUp));
      window.setTimeout(() => void speakAs(beat, villager, line.t), 900);
    };
    const fallback = window.setTimeout(() => settle(null), 3200);
    void request([{ role: "learner", t: answer }]).then(settle);
    return () => {
      alive = false;
      window.clearTimeout(fallback);
    };
  }, [answer, beat, villager, request, learnerName]);

  const send = async (text: string) => {
    const next: Turn[] = [...turns, { role: "learner", t: text }];
    setTurns(next);
    setFollowUp(false);
    setThinking(true);
    const result = await request(next);
    setThinking(false);
    if (!result) return;
    setTurns([...next, { role: "character", t: result.reply, en: result.english }]);
    setFollowUp(result.followUp);
    void speakAs(beat, villager, result.reply);
  };

  return (
    <>
      {turns.map((turn, i) =>
        turn.role === "learner" ? (
          <div key={i} className="scene-bubble is-learner">
            <span className="scene-speaker is-you">
              <GlossedLine line={extras().lines.you} />
            </span>
            <div className="scene-line">
              <Glossed text={turn.t} />
            </div>
          </div>
        ) : (
          <Bubble
            key={i}
            speaker={speaker}
            accent={accent}
            line={{ t: turn.t, en: turn.en ?? "" }}
            reaction
            onPlay={() => void speakAs(beat, villager, turn.t)}
          />
        ),
      )}
      {thinking ? (
        <div className="scene-bubble is-reaction is-thinking">
          <span className="scene-speaker" style={{ background: accent }}>{speaker}</span>
          <span className="scene-dots" aria-label="…">
            <i />
            <i />
            <i />
          </span>
        </div>
      ) : null}
      {followUp && !thinking ? <FollowUpInput onSend={send} /> : null}
    </>
  );
}

function Bubble({
  speaker,
  accent,
  line,
  blurred = false,
  reaction = false,
  onPlay,
}: {
  speaker: string;
  accent?: string;
  line: Line;
  blurred?: boolean;
  reaction?: boolean;
  onPlay: () => void;
}) {
  const { ui } = useIsland();
  return (
    <div className={`scene-bubble ${reaction ? "is-reaction" : ""}`}>
      <span className="scene-speaker" style={{ background: accent }}>{speaker}</span>
      <div className={`scene-line ${blurred ? "is-blurred" : ""}`}>
        <Glossed text={line.t} en={line.en} />
        {blurred || !line.en ? null : <span className="scene-line-en">{line.en}</span>}
      </div>
      <button className="icon-button" aria-label={aria(ui.listen)} onClick={onPlay}>
        <Volume2 size={17} />
      </button>
    </div>
  );
}

// An optional extra turn: say anything, the character answers.
function FollowUpInput({ onSend }: { onSend: (text: string) => void }) {
  const { code, ui } = useIsland();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const mic = useMemo(() => canRecognizeSpeech(), []);
  const submit = () => {
    if (!text.trim()) return;
    sound.play("pop");
    onSend(text.trim());
    setText("");
  };
  return (
    <form
      className="scene-followup"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        lang={getTargetLanguage(code).locale}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={extras().lines.keepTalking.t}
        aria-label={aria(ui.replyIfYouLike)}
        autoComplete="off"
        spellCheck={false}
      />
      {mic ? (
        <button
          type="button"
          className={`icon-button mic ${listening ? "is-live" : ""}`}
          aria-label={aria(ui.sayIt)}
          onClick={async () => {
            if (listening) return stopListening();
            setListening(true);
            try {
              const result = await listen((t) => setText(t));
              if (result.transcript) setText(result.transcript);
            } catch {
              // Typing still works.
            } finally {
              setListening(false);
            }
          }}
        >
          <Mic size={18} />
        </button>
      ) : null}
      <button type="submit" className="icon-button" aria-label={aria(ui.send)} disabled={!text.trim()}>
        <Send size={17} />
      </button>
    </form>
  );
}

function MeetBeat({ beat, expected, meaning, busy, onRecord }: { beat: SceneBeat; expected: string; meaning: string; busy: boolean; onRecord: RecordFn }) {
  const { ui } = useIsland();
  return (
    <div className="activity">
      <p className="scene-situation">{beat.situation}</p>
      <p className="activity-kicker">
        <GlossedLine line={extras().lines.youCanSay} />
      </p>
      <div className="activity-phrase">
        <Glossed text={expected} en={meaning} as="h3" />
        <ListenButtons onPlay={(slow) => void speak(expected, { slow })} />
      </div>
      <p className="activity-meaning">{meaning}</p>
      <SayItPractice expected={expected} />
      <div className="dialogue-actions">
        <button
          className="btn btn-primary"
          disabled={busy}
          autoFocus
          onClick={() => void onRecord({ successful: true, assisted: true, response: "", expected, check: "exact", replays: 0, input: "text" })}
        >
          <GlossedLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function ReplyBeat({
  beat,
  round,
  expected,
  meaning,
  onRecord,
}: {
  beat: SceneBeat;
  round: ReturnType<typeof useLessonRound>;
  expected: string;
  meaning: string;
  onRecord: RecordFn;
}) {
  const { activity, busy, stateBefore, scoped } = round;
  const pool = useMemo(() => scoped.map((c) => c.canonicalForm), [scoped]);
  // A ride has to reach your stop before you can say you're getting off.
  const [arrived, setArrived] = useState(!beat.ride);
  useEffect(() => {
    if (arrived) return;
    const timer = window.setTimeout(() => {
      setArrived(true);
      sound.play("ring");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [arrived]);
  if (!activity) return null;
  const single = !expected.trim().includes(" ");
  const useTiles = !single && (stateBefore?.recall ?? null) === null;

  // Exact (or nearly), another natural way to say it, or — for the course's own
  // sentence — whatever the evaluator accepts as fulfilling the task.
  const judge = async (answer: string) => {
    const code = island().code;
    const check = checkAnswer(answer, expected, code);
    if (check !== "wrong") return { successful: true, check };
    if (acceptsAnswer(beat.accept ?? activity.exercise.accept, answer, code)) return { successful: true, check: "exact" as const };
    if (!beat.expect) return judgeAnswer(activity, answer, expected);
    return { successful: false, check };
  };

  return (
    <div className="activity">
      <p className="scene-situation">{beat.situation}</p>
      {!arrived ? (
        <p className="activity-kicker scene-riding">
          <TrainFront size={16} /> <GlossedLine line={extras().lines.riding} />
        </p>
      ) : (
        <>
          <p className="activity-kicker">
            <GlossedLine line={extras().lines.answer} /> <span className="scene-hint">“{meaning}”</span>
          </p>
          {useTiles ? (
            <Tiles
              expected={expected}
              pool={pool}
              busy={busy}
              onSubmit={async (answer) => {
                const { successful, check } = await judge(answer);
                return onRecord({ successful, assisted: false, response: answer, expected, check, replays: 0, input: "tiles" });
              }}
            />
          ) : (
            <FreeAnswer
              busy={busy}
              hint={expected}
              onSubmit={async (answer, via, hinted) => {
                const { successful, check } = await judge(answer);
                return onRecord({ successful, assisted: hinted, response: answer, expected, check, replays: 0, input: via });
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------- Listening drills ----------

type DrillProps = {
  villager: Villager;
  slug: string;
  beat: SceneBeat | null;
  expected: string;
  activity: AdaptiveActivity;
  busy: boolean;
  name: string | null;
  onRecord: RecordFn;
};

function ListeningDrill(props: DrillProps) {
  const { slug, activity } = props;
  const drill = island().drills[slug];
  if (drill === "who" && activity.listening && nameIn(activity.listening.text, extras())) return <WhoIsTalking {...props} />;
  if (drill === "sign") return <SignPick {...props} />;
  if (drill === "board") return <BoardHunt {...props} />;
  if (extras().whenSentences[slug]) return <WhenPick {...props} />;
  return <ReplyPick {...props} />;
}

// Play a line on arrival, let it be replayed, count replays.
function useHeard(text: string, villager: Villager, clipId?: string, pitch?: number) {
  const replays = useRef(0);
  const play = useCallback(
    (slow = false) => {
      replays.current++;
      void speak(text, { clipId, pitch: pitch ?? villager.voicePitch, slow });
    },
    [text, clipId, pitch, villager.voicePitch],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => play(), 350);
    return () => window.clearTimeout(timer);
  }, [play]);
  return { play, replays: () => Math.max(0, replays.current - 1) };
}

function DrillHead({ kicker, situation, onPlay }: { kicker: Line; situation: string; onPlay: (slow: boolean) => void }) {
  return (
    <>
      <p className="scene-situation">{situation}</p>
      <div className="cafe-point-head">
        <p className="activity-kicker">
          <GlossedLine line={kicker} />
        </p>
        <ListenButtons onPlay={onPlay} />
      </div>
    </>
  );
}

function stateFor(option: string, picked: string | null, answer: string) {
  if (picked === null) return "";
  if (option === answer) return "is-right";
  return option === picked ? "is-wrong" : "is-dim";
}

function Reveal({ line }: { line: { t: string; en?: string } }) {
  return (
    <p className="scene-reveal">
      <Glossed text={line.t} en={line.en} /> {line.en ? <span className="scene-line-en">{line.en}</span> : null}
    </p>
  );
}

// Hear what someone says (no text), pick the reply that fits.
function ReplyPick({ villager, slug, beat, expected, activity, busy, name, onRecord }: DrillProps) {
  const { course } = useIsland();
  const cue = beat?.cue ?? { t: activity.listening?.text ?? expected, en: activity.listening?.meaning };
  const { play, replays } = useHeard(cue.t, villager, beat ? undefined : activity.listening?.audioId, beat?.pitch);
  const [picked, setPicked] = useState<string | null>(null);
  const [options] = useState(() => {
    const others = Object.entries(island().scenes[villager.id] ?? {})
      .filter(([other]) => other !== slug && !beat?.notWith?.includes(other))
      .map(([other, vs]) => {
        const exercise = course.lessons.flatMap((lesson) => lesson.exercises).find((e) => e.conceptSlug === other);
        return vs[0].expect ? vs[0].expect.t : exercise ? expectedFor(exercise, name) : "";
      })
      .filter((text) => text && text !== expected);
    const distractors = others.sort(() => Math.random() - 0.5).slice(0, 2);
    return [expected, ...distractors].sort(() => Math.random() - 0.5);
  });
  const who = beat ? (beat.speaker === "?" ? "Someone" : beat.speaker) : "Someone";
  return (
    <div className="activity">
      <DrillHead kicker={extras().lines.whatDoYouSay} situation={`${who} says something to you. Listen, then pick your answer.`} onPlay={play} />
      {picked ? <Reveal line={cue} /> : null}
      <div className="choice-grid">
        {options.map((option) => (
          <button
            key={option}
            className={`btn choice ${stateFor(option, picked, expected)}`}
            disabled={busy || picked !== null}
            onClick={() => {
              setPicked(option);
              // The feedback shows (and says) the reply that fits, not the line that was heard.
              void onRecord({ successful: option === expected, assisted: false, response: option, expected, check: "choice", replays: replays(), input: "choice" });
            }}
          >
            <Glossed text={option} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Elin: a passenger introduces themselves; tap their name tag.
function WhoIsTalking({ villager, activity, busy, onRecord }: DrillProps) {
  const listening = activity.listening!;
  const answer = nameIn(listening.text, extras())!;
  const { play, replays } = useHeard(listening.text, villager, listening.audioId);
  const [picked, setPicked] = useState<string | null>(null);
  const [options] = useState(() => {
    const others = extras().guestNames.filter((n) => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    return [answer, ...others].sort(() => Math.random() - 0.5);
  });
  return (
    <div className="activity">
      <DrillHead kicker={extras().lines.whoIsTalking} situation="A new passenger steps off and introduces themselves. Who is it?" onPlay={play} />
      <div className="name-tags">
        {options.map((option) => (
          <button
            key={option}
            className={`name-tag ${picked ? (option === answer ? "is-right" : option === picked ? "is-wrong" : "") : ""}`}
            disabled={busy || picked !== null}
            onClick={() => {
              setPicked(option);
              void onRecord({ successful: option === answer, assisted: false, response: option, expected: listening.text, check: "choice", replays: replays(), input: "choice" });
            }}
          >
            <span className="name-tag-hello">{extras().nameTag}</span>
            <strong>{option}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

// Stina: someone asks the way; point at the right sign.
function SignPick({ villager, busy, onRecord }: DrillProps) {
  const [question] = useState(() => extras().whereQuestions[Math.floor(Math.random() * extras().whereQuestions.length)]);
  const { play, replays } = useHeard(question.t, villager, undefined, 1.1);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="activity">
      <DrillHead kicker={extras().lines.whichSign} situation="A traveller asks you the way. Point at the sign they need." onPlay={play} />
      <div className="scene-signs">
        {extras().signs.map((sign) => (
          <button
            key={sign.id}
            className={`scene-sign ${stateFor(sign.id, picked, question.sign)}`}
            disabled={busy || picked !== null}
            onClick={() => {
              setPicked(sign.id);
              void onRecord({ successful: sign.id === question.sign, assisted: false, response: sign.line.t, expected: question.t, check: "choice", replays: replays(), input: "choice" });
            }}
          >
            <span className="scene-sign-arrow" aria-hidden="true">➜</span>
            <GlossedLine line={sign.line} />
          </button>
        ))}
      </div>
      {picked ? <Reveal line={question} /> : null}
    </div>
  );
}

// Stina: a platform announcement; find the train on the board.
function BoardHunt({ villager, busy, onRecord }: DrillProps) {
  const [announcement] = useState(() => extras().announcements[Math.floor(Math.random() * extras().announcements.length)]);
  const { play, replays } = useHeard(announcement.t, villager, undefined, 0.95);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="activity">
      <DrillHead kicker={extras().lines.whichTrain} situation="The loudspeaker crackles. Which train is it about?" onPlay={play} />
      <div className="scene-board scene-board-pick">
        {extras().departures.map((d) => (
          <button
            key={d.to}
            className={`scene-board-row ${stateFor(d.to, picked, announcement.to)}`}
            disabled={busy || picked !== null}
            onClick={() => {
              setPicked(d.to);
              void onRecord({ successful: d.to === announcement.to, assisted: false, response: d.to, expected: announcement.t, check: "choice", replays: replays(), input: "choice" });
            }}
          >
            <span>{d.time}</span>
            <span>{d.to}</span>
            <GlossedLine line={trackLabel(extras(), d.track)} />
          </button>
        ))}
      </div>
      {picked ? <Reveal line={announcement} /> : null}
    </div>
  );
}

// Hear a sentence, decide whether it's about yesterday, today or tomorrow.
function WhenPick({ villager, slug, busy, onRecord }: DrillProps) {
  const [sentence] = useState(() => {
    const pool = extras().whenSentences[slug];
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const { play, replays } = useHeard(sentence.t, villager);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="activity">
      <DrillHead kicker={extras().lines.when} situation={`${villager.name} tells you about their week. When are they talking about?`} onPlay={play} />
      <div className="scene-when">
        {extras().calendar.map((day) => (
          <button
            key={day.id}
            className={`btn choice scene-when-day ${stateFor(day.id, picked, sentence.time)}`}
            disabled={busy || picked !== null}
            onClick={() => {
              setPicked(day.id);
              void onRecord({ successful: day.id === sentence.time, assisted: false, response: day.line.t, expected: sentence.t, check: "choice", replays: replays(), input: "choice" });
            }}
          >
            <GlossedLine line={day.line} />
          </button>
        ))}
      </div>
      {picked ? <Reveal line={sentence} /> : null}
    </div>
  );
}

// ---------- Bonus: put an exchange back in order ----------

function DialogPuzzle({ beat, expected, villager, name, onDone }: { beat: SceneBeat; expected: string; villager: Villager; name: string | null; onDone: () => void }) {
  const { ui } = useIsland();
  const who = speakerOf(beat, true);
  const reaction = reactionTo(beat, expected, name ?? "", extras(), island().code);
  const lines = [
    { id: 0, who, t: beat.cue.t },
    { id: 1, who: extras().lines.you.t, t: expected },
    { id: 2, who, t: reaction.t },
  ];
  const [order] = useState(() => [0, 1, 2].sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const done = placed.length === lines.length;
  return (
    <div className="activity">
      <p className="activity-kicker">
        <GlossedLine line={extras().lines.puzzle} /> <span className="scene-hint">{extras().lines.puzzleHelp.en}</span>
      </p>
      <ol className="scene-puzzle-placed">
        {placed.map((id) => (
          <li key={id}>
            <strong>{lines[id].who}:</strong> <Glossed text={lines[id].t} />
          </li>
        ))}
      </ol>
      {!done ? (
        <div className="choice-grid">
          {order
            .filter((id) => !placed.includes(id))
            .map((id) => (
              <button
                key={id}
                className={`btn choice ${shake === id ? "is-shake" : ""}`}
                onClick={() => {
                  if (id === placed.length) {
                    sound.play(id === lines.length - 1 ? "sparkle" : "tile");
                    void speak(lines[id].t, { pitch: id === 1 ? 1 : beat.pitch ?? villager.voicePitch });
                    setPlaced([...placed, id]);
                  } else {
                    sound.play("wrong");
                    setShake(id);
                    window.setTimeout(() => setShake(null), 400);
                  }
                }}
              >
                <strong>{lines[id].who}:</strong>&nbsp;<Glossed text={lines[id].t} />
              </button>
            ))}
        </div>
      ) : (
        <div className="dialogue-actions">
          <button className="btn btn-primary" autoFocus onClick={onDone}>
            <GlossedLine line={ui.next} /> <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Stages ----------

function Avatar({ name }: { name: string }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0) * 37, 0) % 360;
  return (
    <span className="scene-avatar" style={{ background: `hsl(${hue} 55% 62%)` }} aria-hidden="true">
      {name.charAt(0)}
    </span>
  );
}

function DockStage({ wins }: StageProps) {
  const guests = [...new Set(wins.map((w) => w.guest ?? w.speaker).filter((n) => extras().guestNames.includes(n)))];
  return (
    <div className="scene-stage">
      <div className="scene-panel scene-guestbook">
        <span className="scene-panel-title">
          <BookUser size={14} /> <GlossedLine line={extras().lines.guestBook} />
        </span>
        <div className="scene-guests">
          {guests.length === 0 ? <span className="scene-empty">…</span> : null}
          {guests.map((guest) => (
            <span key={guest} className="scene-guest">
              <Avatar name={guest} /> {guest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StationStage({ beat, wins, answered }: StageProps) {
  // The train moves one stop along per good answer; a ride beat pulls into its stop.
  const riding = beat?.ride ? extras().journey.indexOf(beat.ride) : -1;
  const position = riding >= 0 && !answered ? riding : Math.min(extras().journey.length - 1, wins.length);
  return (
    <div className="scene-stage">
      <div className="scene-panel scene-board">
        <span className="scene-panel-title">
          <GlossedLine line={extras().lines.departures} />
        </span>
        <table>
          <tbody>
            {extras().departures.map((d) => (
              <tr key={d.to} className={beat?.departure === d.to ? "is-highlight" : ""}>
                <td>{d.time}</td>
                <td>{d.to}</td>
                <td>
                  <GlossedLine line={trackLabel(extras(), d.track)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="scene-panel scene-journey">
        <span className="scene-panel-title">
          <GlossedLine line={extras().lines.journey} />
        </span>
        <ol style={{ "--stops": extras().journey.length, "--at": position } as React.CSSProperties}>
          {extras().journey.map((stop, i) => (
            <li key={stop} className={`${i <= position ? "is-passed" : ""} ${beat?.ride === stop ? "is-target" : ""}`}>
              <span className="scene-stop-dot" />
              <span className="scene-stop-name">{stop}</span>
            </li>
          ))}
          <span className="scene-train" aria-hidden="true">
            <TrainFront size={18} />
          </span>
        </ol>
      </div>
    </div>
  );
}

function GardenStage({ beat, wins }: StageProps) {
  const pots = 6;
  return (
    <div className="scene-stage">
      <div className="scene-panel scene-calendar">
        {extras().calendar.map((day) => (
          <span key={day.id} className={`scene-day ${beat?.time === day.id ? "is-now" : ""}`}>
            <GlossedLine line={day.line} />
          </span>
        ))}
      </div>
      <div className="scene-panel scene-pots" aria-label={`${wins.length} ${island().ui.flowers.t} (${island().ui.flowers.en})`}>
        {Array.from({ length: pots }, (_, i) => (
          <span key={i} className={`scene-pot ${i < wins.length ? "is-bloom" : ""}`}>
            {i < wins.length ? <Flower2 size={22} /> : <Sprout size={16} />}
          </span>
        ))}
      </div>
    </div>
  );
}

function StampStage({ wins }: StageProps) {
  const slots = 6;
  return (
    <div className="scene-stage">
      <div className="scene-panel scene-stamps">
        <span className="scene-panel-title">
          <Stamp size={14} /> <GlossedLine line={extras().lines.stamps} />
        </span>
        <div className="scene-stamp-row">
          {Array.from({ length: slots }, (_, i) => (
            <span key={i} className={`scene-stamp ${i < wins.length ? "is-stamped" : ""}`}>
              {i < wins.length ? <Star size={18} /> : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
