"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeftRight, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight, Ear, Printer, RotateCcw, TrainFront, Users, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { STATION_LEVELS, stationStars } from "@/lib/game/station";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { hostHeadStation, travellerHead } from "./station-room";
import {
  askKind,
  beginStation,
  chooseDestination,
  chooseKind,
  currentTraveller,
  leaveStation,
  move,
  pardon,
  printTicket,
  restartWay,
  sayStep,
  startStation,
  stationRuntime,
  stationSetup,
  stepLine,
  tellPlatform,
  useStation,
  type StationSetup,
} from "./station-store";
import { JobBar, JobClock, JobIntro, JobLabel, JobSummary, useWordLabel } from "./job-ui";
import { cornerPoint } from "./station-layout";

// ---------- Starting ----------

// The station master can use a hand once you know the ticket words.
export function useStationStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const station = pack.station;
    if (!station || station.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const { concepts } = station;
    const setup: StationSetup = {
      code: pack.code,
      host: villager,
      station,
      destinations: station.destinations.map((d) => d.slug),
      landmarks: station.landmarks.filter((l) => met(l.slug)).map((l) => l.slug),
      ways: [concepts.left, concepts.right, concepts.straight].every(met),
      platform: met(concepts.platform) && [1, 2, 3, 4].every((n) => met(station.numbers[n])),
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = [concepts.ticket, concepts.single, concepts.return].every(met);
    return { ready, start: (level = save?.level ?? 0) => startStation(setup, level), invite: station.lines.invite, notYet: station.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function StationUI() {
  const setup = stationSetup();
  const status = useStation((s) => s.status);
  const step = useStation((s) => s.step);
  const index = useStation((s) => s.index);
  if (!setup) return null;
  return (
    <div className="shift">
      <StationTop setup={setup} />
      {status === "running" ? (
        <>
          <Bubble setup={setup} />
          {step === "ticket" || step === "platform" ? <Timetable setup={setup} /> : null}
          {step === "ticket" ? <TicketPanel setup={setup} /> : null}
          {step === "platform" ? <PlatformPanel key={index} setup={setup} /> : null}
          {step === "way" ? (
            <>
              <WalkPanel />
              <LandmarkLabels setup={setup} />
            </>
          ) : null}
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function StationTop({ setup }: { setup: StationSetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useStationStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, helped, travellers } = useStation((s) => s);
  const { lines } = setup.station;
  return (
    <JobBar icon={<TrainFront size={22} />} title={lines.title} levelIndex={levelIndex} levels={STATION_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveStation}>
      <span>
        <Users size={18} /> <strong>{helped}</strong>
        <span className="shift-of">/ {travellers.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => stationRuntime.seconds / stationRuntime.total} />
    </JobBar>
  );
}

// The traveller asking, or Lena with the directions.
function Bubble({ setup }: { setup: StationSetup }) {
  const { said, revealed, step, index, ticket } = useStation((s) => s);
  const inTown = useStation((s) => s.town.inTown);
  const traveller = useStation(() => currentTraveller());
  const current = useMemo(() => stepLine(step, traveller, ticket.asked), [step, traveller, ticket.asked]);
  const by = said?.by === "host" || (!said && current?.by === "host") ? "host" : "traveller";
  // In town Lena is back at the station, so her directions float over the traveller beside you.
  const where = useCallback(() => (by === "host" && !inTown ? hostHeadStation() : travellerHead()), [by, inTown]);
  const ref = useShiftAnchor("station-bubble", where, undefined, "side");
  if (!current && !said) return <div ref={ref} className="world-anchor" />;
  const name = by === "host" ? setup.host.name : null;
  const showLine = current && !said?.repeats && (current.by === by || step === "way");
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
              <Glossed text={current.line.t} en={current.line.en} />
            </p>
          ) : (
            <p className="shift-order is-heard">
              <Ear size={18} /> …
            </p>
          )
        ) : null}
        {current ? (
          <div className="shift-bubble-tools">
            <button className="icon-button" aria-label={aria(setup.station.lines.repeat)} onClick={() => sayStep()}>
              <Volume2 size={16} />
            </button>
            <button className="shift-pardon" onClick={pardon}>
              <GlossedLine line={setup.station.lines.repeat} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Where each train goes and from which platform.
function Timetable({ setup }: { setup: StationSetup }) {
  const { lines, destinations } = setup.station;
  return (
    <div className="station-board" aria-label={aria(lines.board)}>
      <GlossedLine line={lines.board} className="station-board-title" />
      <ul>
        {destinations.map((d) => (
          <li key={d.slug}>
            <span>{d.name.t}</span>
            <strong>{d.platform}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Making up the ticket: where to, and (once you've asked) one way or return.
function TicketPanel({ setup }: { setup: StationSetup }) {
  const ticket = useStation((s) => s.ticket);
  const { lines, destinations } = setup.station;
  return (
    <div className="shift-tray station-ticket" aria-label={aria(lines.ticket)}>
      <GlossedLine line={lines.ticket} className="cafe-board-title" />
      <div className="ferry-options">
        {destinations.map((d) => (
          <button key={d.slug} className={`ferry-option ${ticket.destination === d.slug ? "is-on" : ""}`} aria-pressed={ticket.destination === d.slug} onClick={() => chooseDestination(d.slug)}>
            {d.name.t}
          </button>
        ))}
      </div>
      {ticket.asked ? (
        <div className="ferry-options">
          <button className={`ferry-option station-kind ${ticket.kind === "single" ? "is-on" : ""}`} aria-label="one way" aria-pressed={ticket.kind === "single"} onClick={() => chooseKind("single")}>
            <ArrowRight size={20} />
          </button>
          <button className={`ferry-option station-kind ${ticket.kind === "return" ? "is-on" : ""}`} aria-label="return" aria-pressed={ticket.kind === "return"} onClick={() => chooseKind("return")}>
            <ArrowLeftRight size={20} />
          </button>
        </div>
      ) : (
        <button className="btn" onClick={askKind}>
          <GlossedLine line={lines.whichKind} />
        </button>
      )}
      <button className="btn btn-primary shift-trash" disabled={!ticket.destination || !ticket.kind} onClick={printTicket}>
        <Printer size={17} /> <GlossedLine line={lines.print} />
      </button>
    </div>
  );
}

function PlatformPanel({ setup }: { setup: StationSetup }) {
  const [round, setRound] = useState(0);
  const traveller = useStation(() => currentTraveller());
  if (traveller?.kind !== "ticket") return null;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <GlossedLine line={setup.station.lines.askPlatform} />
        </p>
        <FreeAnswer
          key={round}
          busy={false}
          hint={setup.station.platform(traveller.destination.platform).t}
          onSubmit={async (answer, via, hinted) => {
            tellPlatform(answer, via, hinted);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

// While the town is new, its places carry their names.
function LandmarkLabels({ setup }: { setup: StationSetup }) {
  const heard = useStation((s) => s.level.heard);
  if (heard) return null;
  return (
    <>
      {setup.station.landmarks
        .filter((l) => setup.landmarks.includes(l.slug))
        .map((l) => {
          const at = cornerPoint(l.node, l.corner);
          return <JobLabel key={l.slug} id={`landmark:${l.slug}`} at={[at.x, 3.2, at.z]} text={l.name.t} en={l.name.en} />;
        })}
    </>
  );
}

// Walking the town: turn left, straight on, turn right; click the building when you're there.
function WalkPanel() {
  const walking = useStation((s) => s.town.walking);
  return (
    <div className="shift-tray station-walk">
      <button className="btn station-arrow" aria-label="left" disabled={walking} onClick={() => move("left")}>
        <CornerUpLeft size={26} />
      </button>
      <button className="btn station-arrow" aria-label="straight on" disabled={walking} onClick={() => move("forward")}>
        <ArrowUp size={26} />
      </button>
      <button className="btn station-arrow" aria-label="right" disabled={walking} onClick={() => move("right")}>
        <CornerUpRight size={26} />
      </button>
      <button className="btn btn-quiet station-arrow" aria-label="start again" disabled={walking} onClick={restartWay}>
        <RotateCcw size={20} />
      </button>
    </div>
  );
}

function Intro({ setup }: { setup: StationSetup }) {
  const { host, station } = setup;
  const levelIndex = useStation((s) => s.levelIndex);
  const travellers = useStation((s) => s.travellers);
  const [lines] = useState(() => {
    const record = getGame().save.shifts[host.id];
    const firstTime = !(record?.stars.length ?? 0);
    const base = firstTime ? station.lines.intro : [station.lines.intro[station.lines.intro.length - 1]];
    // The first run with a way to show explains the suitcases.
    const waysNow = travellers.some((t) => t.kind === "way");
    const waysBefore = (record?.stars ?? []).some((_, i) => STATION_LEVELS[i]?.ways > 0);
    return waysNow && !waysBefore ? [...base, station.lines.townIntro] : base;
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={STATION_LEVELS.length} onDone={beginStation} />;
}

function Summary({ setup }: { setup: StationSetup }) {
  const { helped, travellers, words, levelUp, gift, levelIndex, late, timeLeft } = useStation((s) => s);
  const starter = useStationStarter(setup.host);
  const label = useWordLabel();
  const stars = stationStars(helped, travellers.length, timeLeft);
  const { lines } = setup.station;
  return (
    <JobSummary
      gift={gift}
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <Users size={18} /> {helped} / {travellers.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveStation}
    />
  );
}
