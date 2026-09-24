"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookUser, Flower2, Snail, Sprout, TrainFront, Volume2 } from "lucide-react";
import { checkAnswer, expectedFor, meaningOf } from "@/lib/game/lesson";
import { calendar, departures, guestNames, journey, nameIn, sceneBeats, sceneLines, type SceneBeat } from "@/lib/game/scenes";
import { ui } from "@/lib/game/ui-text";
import type { Line, Villager } from "@/lib/game/villagers";
import type { AdaptiveActivity } from "@/lib/learning/adaptive";
import { sound } from "../audio/sfx";
import { speakSwedish } from "../audio/speech";
import {
  ActivityView,
  Feedback,
  FreeAnswer,
  judgeAnswer,
  SayItPractice,
  Tiles,
  useLessonRound,
  type Outcome,
  type RecordFn,
  type RoundSummary,
} from "./lesson-round";
import { Sv, SvLine } from "./sv";

const SCENE_ROUND = 6;

export function ListenButtons({ onPlay }: { onPlay: (slow: boolean) => void }) {
  return (
    <div className="listen-buttons">
      <button className="icon-button big" aria-label="Lyssna (listen)" onClick={() => onPlay(false)}>
        <Volume2 size={22} />
      </button>
      <button className="icon-button" aria-label="Långsamt (slowly)" onClick={() => onPlay(true)}>
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

type StageProps = {
  villager: Villager;
  beat: SceneBeat | null;
  wins: SceneBeat[];
  answered: boolean;
  activity: AdaptiveActivity;
};

// Elin, Stina and Astrid teach through little exchanges: someone says the cue,
// you answer with the phrase, and they react. The schedule underneath is the
// same adaptive one every lesson uses.
export function SceneRound({ villager, onFinish }: { villager: Villager; onFinish: (summary: RoundSummary) => void }) {
  const round = useLessonRound(villager, onFinish, { roundLength: SCENE_ROUND });
  const { activity, concept, name, outcome, queued, busy, attempts, summary } = round;
  const [wins, setWins] = useState<SceneBeat[]>([]);
  const beats = sceneBeats[villager.id] ?? {};

  if (!activity || !concept) {
    return (
      <div className="dialogue-actions">
        <button className="btn btn-primary" autoFocus onClick={() => onFinish(summary.current)}>
          <SvLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const beat = beats[concept.slug] ?? null;
  const exercise = activity.exercise;
  const expected = expectedFor(exercise, name);
  const meaning = meaningOf(exercise, name);
  const listening = activity.mode === "listen" || activity.mode === "dictation";
  const key = activity.id + attempts.length;

  const record: RecordFn = async (p) => {
    await round.record(p);
    if (p.successful && activity.mode !== "encounter" && beat) setWins((w) => [...w, beat]);
  };

  let body: React.ReactNode;
  if (outcome) {
    body = <Feedback outcome={outcome} onNext={() => round.advance(queued)} />;
  } else if (beat && activity.mode === "encounter") {
    body = <MeetBeat key={key} beat={beat} expected={expected} meaning={meaning} busy={busy} onRecord={record} />;
  } else if (villager.id === "elin" && activity.mode === "listen" && activity.listening && nameIn(activity.listening.text)) {
    body = <WhoIsTalking key={key} activity={activity} villager={villager} busy={busy} onRecord={record} />;
  } else if (beat && !listening) {
    body = <ReplyBeat key={key} beat={beat} round={round} expected={expected} meaning={meaning} onRecord={record} />;
  } else {
    body = (
      <ActivityView
        key={key}
        activity={activity}
        villager={villager}
        name={name}
        state={round.stateBefore}
        pool={round.scoped.map((c) => c.canonicalForm)}
        busy={busy}
        onRecord={record}
      />
    );
  }

  const Stage = villager.id === "elin" ? DockStage : villager.id === "stina" ? StationStage : GardenStage;
  const showBeat = beat && !(listening && !outcome) ? beat : null;
  return (
    <div className={`lesson scene scene-${villager.id}`} aria-busy={busy}>
      <RoundProgress length={SCENE_ROUND} done={attempts.length} />
      <Stage villager={villager} beat={showBeat} wins={wins} answered={Boolean(outcome)} activity={activity} />
      {showBeat ? <SpeechBubble key={`bubble:${key}`} beat={showBeat} villager={villager} outcome={outcome} /> : null}
      {body}
      {round.error ? (
        <p className="lesson-error" role="alert">
          <SvLine line={ui.error} /> <button onClick={() => round.setError(false)}><SvLine line={ui.tryAgain} /></button>
        </p>
      ) : null}
    </div>
  );
}

// ---------- The exchange ----------

function speakAs(beat: SceneBeat, villager: Villager, text: string, slow = false) {
  const self = beat.speaker === villager.name;
  return speakSwedish(text, { who: self ? villager.id : undefined, pitch: beat.pitch ?? villager.voicePitch, slow });
}

function SpeechBubble({ beat, villager, outcome }: { beat: SceneBeat; villager: Villager; outcome: Outcome | null }) {
  const reacting = Boolean(outcome?.correct);
  const line: Line = reacting ? beat.reaction : beat.cue;
  const speaker = reacting && beat.guest ? beat.guest : beat.speaker;
  // Fast talk is a blur until the learner has asked for help.
  const blurred = beat.fast && !outcome;

  useEffect(() => {
    if (!reacting) {
      const timer = window.setTimeout(() => void speakAs(beat, villager, beat.cue.sv), 300);
      return () => window.clearTimeout(timer);
    }
    // Let the model answer play first, then the reply.
    const timer = window.setTimeout(() => void speakAs(beat, villager, beat.reaction.sv), 1900);
    return () => window.clearTimeout(timer);
  }, [reacting, beat, villager]);

  return (
    <div className={`scene-bubble ${reacting ? "is-reaction" : ""}`}>
      <span className="scene-speaker" style={{ background: speaker === villager.name ? villager.look.accent : undefined }}>
        {speaker === "?" ? "?" : speaker}
      </span>
      <div className={`scene-line ${blurred ? "is-blurred" : ""}`}>
        <Sv text={line.sv} en={line.en} />
        {blurred ? null : <span className="scene-line-en">{line.en}</span>}
      </div>
      <button className="icon-button" aria-label="Lyssna (listen)" onClick={() => void speakAs(beat, villager, line.sv)}>
        <Volume2 size={17} />
      </button>
    </div>
  );
}

function MeetBeat({
  beat,
  expected,
  meaning,
  busy,
  onRecord,
}: {
  beat: SceneBeat;
  expected: string;
  meaning: string;
  busy: boolean;
  onRecord: RecordFn;
}) {
  return (
    <div className="activity">
      <p className="scene-situation">{beat.situation}</p>
      <p className="activity-kicker">
        <SvLine line={sceneLines.youCanSay} />
      </p>
      <div className="activity-phrase">
        <Sv text={expected} en={meaning} as="h3" />
        <ListenButtons onPlay={(slow) => void speakSwedish(expected, { slow })} />
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
          <SvLine line={ui.next} /> <ArrowRight size={18} />
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
  return (
    <div className="activity">
      <p className="scene-situation">{beat.situation}</p>
      {!arrived ? (
        <p className="activity-kicker scene-riding">
          <TrainFront size={16} /> <SvLine line={sceneLines.riding} />
        </p>
      ) : (
        <>
          <p className="activity-kicker">
            <SvLine line={sceneLines.answer} /> <span className="scene-hint">“{meaning}”</span>
          </p>
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
                const { successful, check } = await judgeAnswer(activity, answer, expected);
                return onRecord({ successful, assisted: hinted, response: answer, expected, check, replays: 0, input: via });
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Elin's listening drill: a passenger introduces themselves; tap their name tag.
function WhoIsTalking({
  activity,
  villager,
  busy,
  onRecord,
}: {
  activity: AdaptiveActivity;
  villager: Villager;
  busy: boolean;
  onRecord: RecordFn;
}) {
  const listening = activity.listening!;
  const answer = nameIn(listening.text)!;
  const [picked, setPicked] = useState<string | null>(null);
  const [replays, setReplays] = useState(0);
  const [options] = useState(() => {
    const others = guestNames.filter((n) => n !== answer).sort(() => Math.random() - 0.5).slice(0, 3);
    return [answer, ...others].sort(() => Math.random() - 0.5);
  });
  const play = useCallback(
    (slow = false) => {
      setReplays((r) => r + 1);
      void speakSwedish(listening.text, { clipId: listening.audioId, who: undefined, pitch: villager.voicePitch, slow });
    },
    [listening, villager.voicePitch],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => play(), 350);
    return () => window.clearTimeout(timer);
  }, [play]);
  return (
    <div className="activity">
      <p className="scene-situation">A new passenger steps off and introduces themselves. Who is it?</p>
      <div className="cafe-point-head">
        <p className="activity-kicker">
          <SvLine line={sceneLines.whoIsTalking} />
        </p>
        <ListenButtons onPlay={play} />
      </div>
      <div className="name-tags">
        {options.map((option) => (
          <button
            key={option}
            className={`name-tag ${picked ? (option === answer ? "is-right" : option === picked ? "is-wrong" : "") : ""}`}
            disabled={busy || picked !== null}
            onClick={() => {
              setPicked(option);
              void onRecord({
                successful: option === answer,
                assisted: false,
                response: option,
                expected: listening.text,
                check: "choice",
                replays: Math.max(0, replays - 1),
                input: "choice",
              });
            }}
          >
            <span className="name-tag-hello">Hej! Jag heter</span>
            <strong>{option}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Stages ----------

function Avatar({ name, accent }: { name: string; accent?: string }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0) * 37, 0) % 360;
  return (
    <span className="scene-avatar" style={{ background: accent ?? `hsl(${hue} 55% 62%)` }} aria-hidden="true">
      {name === "?" ? "?" : name.charAt(0)}
    </span>
  );
}

function DockStage({ wins }: StageProps) {
  const guests = [...new Set(wins.map((w) => w.guest ?? w.speaker).filter((n) => guestNames.includes(n)))];
  return (
    <div className="scene-stage">
      <div className="scene-panel scene-guestbook">
        <span className="scene-panel-title">
          <BookUser size={14} /> <SvLine line={sceneLines.guestBook} />
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
  const riding = beat?.ride ? journey.indexOf(beat.ride) : -1;
  const position = riding >= 0 && !answered ? riding : Math.min(journey.length - 1, wins.length);
  return (
    <div className="scene-stage">
      <div className="scene-panel scene-board">
        <span className="scene-panel-title">
          <SvLine line={sceneLines.departures} />
        </span>
        <table>
          <tbody>
            {departures.map((d) => (
              <tr key={d.to} className={beat?.departure === d.to ? "is-highlight" : ""}>
                <td>{d.time}</td>
                <td>{d.to}</td>
                <td>
                  <Sv text={`spår ${d.track}`} en={`platform ${d.track}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="scene-panel scene-journey">
        <span className="scene-panel-title">
          <SvLine line={sceneLines.journey} />
        </span>
        <ol style={{ "--stops": journey.length, "--at": position } as React.CSSProperties}>
          {journey.map((stop, i) => (
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
        {calendar.map((day) => (
          <span key={day.id} className={`scene-day ${beat?.time === day.id ? "is-now" : ""}`}>
            <SvLine line={day.line} />
          </span>
        ))}
      </div>
      <div className="scene-panel scene-pots" aria-label={`${wins.length} blommor (flowers)`}>
        {Array.from({ length: pots }, (_, i) => (
          <span key={i} className={`scene-pot ${i < wins.length ? "is-bloom" : ""}`}>
            {i < wins.length ? <Flower2 size={22} /> : <Sprout size={16} />}
          </span>
        ))}
      </div>
    </div>
  );
}
