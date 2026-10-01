"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Ear, Ship, Sun, Sunrise, Sunset, Users, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { farewellFor, FERRY_FIELDS, FERRY_LEVELS, ferryStars, timeGreeting, type DayTime, type FerryField } from "@/lib/game/ferry";
import type { Line } from "@/lib/game/line";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { hostHeadFerry, passengerHead } from "./ferry-room";
import {
  askName,
  beginFerry,
  currentPassenger,
  farewell,
  ferryRuntime,
  ferrySetup,
  fill,
  getFerry,
  greet,
  leaveFerry,
  repair,
  replay,
  startFerry,
  stepLine,
  submitEntry,
  useFerry,
  type FerrySetup,
} from "./ferry-store";
import { JobBar, JobClock, JobIntro, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// The ferry keeper can use a hand once you can say hello, goodbye and your name.
export function useFerryStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const ferry = pack.ferry;
    if (!ferry || ferry.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const setup: FerrySetup = {
      code: pack.code,
      host: villager,
      ferry,
      fields: FERRY_FIELDS.filter((f) => met(ferry.frames[f])),
      askName: met(ferry.askName.du.concept) && met(ferry.askName.Sie.concept),
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = ["hallo", "tschuess", ferry.frames.name].every(met);
    return { ready, start: (level = save?.level ?? 0) => startFerry(setup, level), invite: ferry.lines.invite, notYet: ferry.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function FerryUI() {
  const setup = ferrySetup();
  const status = useFerry((s) => s.status);
  const step = useFerry((s) => s.step);
  if (!setup) return null;
  return (
    <div className="shift">
      <FerryTop setup={setup} />
      {status === "running" ? (
        <>
          <Bubble setup={setup} />
          {step === "greet" ? <SayPanel setup={setup} prompt={setup.ferry.lines.greet} onSubmit={greet} hint={() => timeGreeting(setup.ferry, getFerry().time).reply.t} /> : null}
          {step === "ask" ? <SayPanel setup={setup} prompt={setup.ferry.lines.ask} onSubmit={askName} hint={() => setup.ferry.askName[currentPassenger()?.person.register ?? "Sie"].say.t} /> : null}
          {step === "farewell" ? <SayPanel setup={setup} prompt={setup.ferry.lines.farewell} onSubmit={farewell} hint={() => farewellFor(setup.ferry, currentPassenger()?.person.register ?? "Sie").reply.t} /> : null}
          {step === "list" ? <ListPanel setup={setup} /> : null}
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

const timeIcon: Record<DayTime, React.ReactNode> = {
  morning: <Sunrise size={18} />,
  day: <Sun size={18} />,
  evening: <Sunset size={18} />,
};

function FerryTop({ setup }: { setup: FerrySetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useFerryStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, boarded, passengers, time } = useFerry((s) => s);
  const { lines } = setup.ferry;
  const word = setup.ferry.times[time];
  return (
    <JobBar icon={<Ship size={22} />} title={lines.title} levelIndex={levelIndex} levels={FERRY_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveFerry}>
      <span className={`ferry-time is-${time}`} title={word.en}>
        {timeIcon[time]} <Glossed text={word.t} en={word.en} />
      </span>
      <span>
        <Users size={18} /> <strong>{boarded}</strong>
        <span className="shift-of">/ {passengers.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => ferryRuntime.seconds / ferryRuntime.total} />
    </JobBar>
  );
}

// The passenger (or Greta) talking, with what you can say to hear it again.
function Bubble({ setup }: { setup: FerrySetup }) {
  const { said, revealed, step, index, spelled } = useFerry((s) => s);
  const passenger = useFerry(() => currentPassenger());
  const current = useMemo(() => stepLine(step, passenger), [step, passenger]);
  const by = said?.by === "host" ? "host" : "passenger";
  const where = useCallback(() => (by === "host" ? hostHeadFerry() : passengerHead()), [by]);
  const ref = useShiftAnchor("ferry-bubble", where, undefined, "side");
  if ((!current && !said) || !passenger) return <div ref={ref} className="world-anchor" />;
  const name = by === "host" ? setup.host.name : null;
  const register = passenger.person.register;
  const { repairs } = setup.ferry;
  const showLine = current && !said?.repeats;
  return (
    <div ref={ref} className="world-anchor">
      <div key={`${index}:${step}:${by}`} className={`shift-bubble ${said?.by === "player" ? "is-player" : ""}`}>
        {name ? <span className="home-bubble-name">{name}</span> : null}
        {said ? (
          <p className="shift-said">
            <Glossed text={said.line.t} en={said.line.en} />
          </p>
        ) : null}
        {showLine ? (
          revealed ? (
            <p className={said ? "shift-order is-small" : "shift-order"}>
              <Glossed text={current.t} en={current.en} />
            </p>
          ) : (
            <p className="shift-order is-heard">
              <Ear size={18} /> …{spelled ? <span className="ferry-spelled"> {passenger.person.register === "Sie" ? passenger.person.name.split(" ").slice(-1)[0] : passenger.person.name}</span> : null}
            </p>
          )
        ) : null}
        {current ? (
          <div className="shift-bubble-tools ferry-repairs">
            <button className="icon-button" aria-label={aria(repairs.again.say[register])} onClick={replay}>
              <Volume2 size={16} />
            </button>
            {(["again", "slower", "spell"] as const).map((kind) => (
              <button key={kind} className="shift-pardon" onClick={() => void repair(kind)}>
                <GlossedLine line={repairs[kind].say[register]} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Greet, ask the name, say goodbye: typed (or said) in the target language.
function SayPanel({ prompt, hint, onSubmit }: { setup: FerrySetup; prompt: Line; hint: () => string; onSubmit: (text: string, via: "text" | "speech", hinted: boolean) => void }) {
  const [round, setRound] = useState(0);
  const passenger = useFerry(() => currentPassenger());
  if (!passenger) return null;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <GlossedLine line={prompt} />
        </p>
        <FreeAnswer
          key={round}
          busy={false}
          hint={hint()}
          onSubmit={async (answer, via, hinted) => {
            onSubmit(answer, via, hinted);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

// The passenger list: pick what they said for each field, then put it down.
function ListPanel({ setup }: { setup: FerrySetup }) {
  const passenger = useFerry(() => currentPassenger());
  const entry = useFerry((s) => s.entry);
  if (!passenger) return null;
  const { lines } = setup.ferry;
  const chosen = (field: FerryField, value: string) => (field === "speaks" ? entry.speaks.includes(value) : entry[field] === value);
  const options: Record<FerryField, Array<{ id: string; label: Line }>> = {
    name: passenger.options.name.map((n) => ({ id: n, label: { t: n, en: n } })),
    from: passenger.options.from.map((c) => ({ id: c.id, label: c.name })),
    lives: passenger.options.lives.map((c) => ({ id: c.id, label: c.name })),
    speaks: passenger.options.speaks.map((l) => ({ id: l.id, label: l.name })),
  };
  const complete = passenger.fields.every((f) => (f === "speaks" ? entry.speaks.length > 0 : entry[f]));
  return (
    <div className="shift-tray ferry-list" aria-label={aria(lines.list)}>
      <GlossedLine line={lines.list} className="cafe-board-title" />
      <p className="ferry-list-how">
        <GlossedLine line={lines.listen} />
      </p>
      {passenger.fields.map((field) => (
        <div key={field} className="ferry-field">
          <GlossedLine line={lines.fields[field]} className="ferry-field-name" />
          <div className="ferry-options">
            {options[field].map((o) => (
              <button key={o.id} className={`ferry-option ${chosen(field, o.id) ? "is-on" : ""}`} aria-pressed={chosen(field, o.id)} onClick={() => fill(field, o.id)}>
                {o.label.t}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn btn-primary shift-trash" disabled={!complete} onClick={submitEntry}>
        <Check size={17} /> <GlossedLine line={lines.enter} />
      </button>
    </div>
  );
}

function Intro({ setup }: { setup: FerrySetup }) {
  const { host, ferry } = setup;
  const levelIndex = useFerry((s) => s.levelIndex);
  const askNow = useFerry((s) => s.askName);
  const [lines] = useState(() => {
    const record = getGame().save.shifts[host.id];
    const firstTime = !(record?.stars.length ?? 0);
    const base = firstTime ? ferry.lines.intro : [ferry.lines.intro[ferry.lines.intro.length - 1]];
    // The first run with names to ask explains du and Sie.
    const askedBefore = (record?.stars ?? []).some((_, i) => FERRY_LEVELS[i]?.askName);
    return askNow && !askedBefore ? [...base, ferry.lines.registerIntro] : base;
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={FERRY_LEVELS.length} onDone={beginFerry} />;
}

function Summary({ setup }: { setup: FerrySetup }) {
  const { boarded, passengers, words, levelUp, gift, levelIndex, late, timeLeft } = useFerry((s) => s);
  const starter = useFerryStarter(setup.host);
  const label = useWordLabel();
  const stars = ferryStars(boarded, passengers.length, timeLeft);
  const { lines } = setup.ferry;
  return (
    <JobSummary
      gift={gift}
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <Users size={18} /> {boarded} / {passengers.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveFerry}
    />
  );
}
