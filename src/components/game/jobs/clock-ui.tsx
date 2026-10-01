"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Ear, Users, Volume2 } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { CALENDAR_HOURS, CLOCK_LEVELS, clockStars, type TimeForm } from "@/lib/game/clock";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { EASEL, WALL_CLOCK } from "./clock-layout";
import { customerHead, hostHeadClock } from "./clock-room";
import {
  answerAppointment,
  beginClock,
  clockRuntime,
  clockSetup,
  currentCustomer,
  finishSet,
  getClock,
  leaveClock,
  pardon,
  sayStep,
  startClock,
  stepLine,
  tellTime,
  turnHand,
  useClock,
  type ClockSetup,
} from "./clock-store";
import { JobBar, JobClock, JobIntro, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// The clockmaker can use a hand once you can say a few times.
export function useClockStarter(villager: Villager) {
  const model = useLearningModel();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const clock = pack.clock;
    if (!clock || clock.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    const met = (slug: string) => (stateOf(slug)?.exposureCount ?? 0) > 0;
    const forms = (Object.keys(clock.forms) as TimeForm[]).filter((f) => met(clock.forms[f]));
    const hours = clock.numbers.map((slug, i) => (met(slug) ? i + 1 : 0)).filter(Boolean);
    const appointments = clock.appointments;
    const setup: ClockSetup = {
      code: pack.code,
      host: villager,
      clock,
      forms,
      hours,
      days: appointments ? appointments.days.filter((d) => met(d.slug)).map((d) => d.slug) : [],
      appointments: Boolean(appointments && met(appointments.yes.concept) && met(appointments.no.concept)),
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = forms.includes("oclock") && forms.includes("half") && hours.length >= 4;
    return { ready, start: (level = save?.level ?? 0) => startClock(setup, level), invite: clock.lines.invite, notYet: clock.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save]);
}

// ---------- The overlay ----------

export function ClockUI() {
  const setup = clockSetup();
  const status = useClock((s) => s.status);
  const step = useClock((s) => s.step);
  if (!setup) return null;
  return (
    <div className="shift">
      <ClockTop setup={setup} />
      {status === "running" ? (
        <>
          <Bubble setup={setup} />
          {step === "set" ? <SetPanel setup={setup} /> : null}
          {step === "tell" ? <TellPanel setup={setup} /> : null}
          {step === "appointment" ? <CalendarPanel setup={setup} /> : null}
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function ClockTop({ setup }: { setup: ClockSetup }) {
  const { levelIndex, helped, customers } = useClock((s) => s);
  const { lines } = setup.clock;
  return (
    <JobBar icon={<Clock3 size={22} />} title={lines.title} levelIndex={levelIndex} levels={CLOCK_LEVELS.length} onClose={leaveClock}>
      <span>
        <Users size={18} /> <strong>{helped}</strong>
        <span className="shift-of">/ {customers.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => clockRuntime.seconds / clockRuntime.total} />
    </JobBar>
  );
}

function Bubble({ setup }: { setup: ClockSetup }) {
  const { said, revealed, step } = useClock((s) => s);
  const customer = useClock(() => currentCustomer());
  const line = useMemo(() => stepLine(step, customer), [step, customer]);
  const byHost = !line && said?.by === "host";
  const where = useCallback((): [number, number, number] => {
    if (byHost) return hostHeadClock();
    const [x, y, z] = customerHead();
    // Close in on a clock the customer is out of shot, so the bubble sits beside the clock.
    const step = getClock().step;
    if (step === "set") return [EASEL.x + EASEL.radius + 0.35, EASEL.y + 0.45, EASEL.z];
    if (step === "tell") return [WALL_CLOCK.x + 1.15, WALL_CLOCK.y + 0.3, WALL_CLOCK.z + 0.2];
    return [x, y, z];
  }, [byHost]);
  const ref = useShiftAnchor("clock-bubble", where, undefined, "side");
  if (!line && !said) return <div ref={ref} className="world-anchor" />;
  return (
    <div ref={ref} className="world-anchor">
      <div className="shift-bubble">
        {byHost ? <span className="home-bubble-name">{setup.host.name}</span> : null}
        {said ? (
          <p className="shift-said">
            <Glossed text={said.line.t} en={said.line.en} />
          </p>
        ) : null}
        {line && !said?.repeats ? (
          revealed ? (
            <p className={said ? "shift-order is-small" : "shift-order"}>
              <Glossed text={line.t} en={line.en} />
            </p>
          ) : (
            <p className="shift-order is-heard">
              <Ear size={18} /> …
            </p>
          )
        ) : null}
        {line ? (
          <div className="shift-bubble-tools">
            <button className="icon-button" aria-label={aria(setup.clock.lines.repeat)} onClick={() => sayStep()}>
              <Volume2 size={16} />
            </button>
            <button className="shift-pardon" onClick={pardon}>
              <GlossedLine line={setup.clock.lines.repeat} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Buttons for the hands, alongside dragging them on the clock itself.
function SetPanel({ setup }: { setup: ClockSetup }) {
  const { lines } = setup.clock;
  return (
    <div className="shift-tray clock-controls">
      {(["hour", "minute"] as const).map((hand) => (
        <span key={hand} className="clock-hand-control">
          <button className="icon-button" aria-label={`${aria(hand === "hour" ? lines.hour : lines.minute)} −`} onClick={() => turnHand(hand, -1)}>
            <ChevronLeft size={18} />
          </button>
          <GlossedLine line={hand === "hour" ? lines.hour : lines.minute} className={`clock-hand-name is-${hand}`} />
          <button className="icon-button" aria-label={`${aria(hand === "hour" ? lines.hour : lines.minute)} +`} onClick={() => turnHand(hand, 1)}>
            <ChevronRight size={18} />
          </button>
        </span>
      ))}
      <button className="btn btn-primary shift-trash" onClick={finishSet}>
        <Check size={17} /> <GlossedLine line={lines.ready} />
      </button>
      <span className="clock-howto">
        <GlossedLine line={lines.howTo} />
      </span>
    </div>
  );
}

function TellPanel({ setup }: { setup: ClockSetup }) {
  const [round, setRound] = useState(0);
  const customer = useClock(() => currentCustomer());
  if (!customer?.tell) return null;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <GlossedLine line={setup.clock.ask} />
        </p>
        <FreeAnswer
          key={round}
          busy={false}
          hint={setup.clock.say(customer.tell).t}
          onSubmit={async (answer, via, hinted) => {
            tellTime(answer, via, hinted);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

// The week in the calendar; shaded hours are taken.
function CalendarPanel({ setup }: { setup: ClockSetup }) {
  const calendar = useClock((s) => s.calendar);
  const appointments = setup.clock.appointments;
  if (!appointments) return null;
  return (
    <div className="dialogue shift-hatch clock-calendar" role="dialog">
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <GlossedLine line={setup.clock.lines.calendar} />
        </p>
        <table className="clock-week">
          <thead>
            <tr>
              <th />
              {CALENDAR_HOURS.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.days.map((day) => (
              <tr key={day.slug}>
                <th>
                  <Glossed text={day.name.t} en={day.name.en} />
                </th>
                {CALENDAR_HOURS.map((h) => {
                  const busy = (calendar[day.slug] ?? []).includes(h);
                  return <td key={h} className={busy ? "is-busy" : ""} title={busy ? setup.clock.lines.busy.t : undefined} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dialogue-actions">
          <button className="btn btn-primary" onClick={() => answerAppointment(true)}>
            <Glossed text={appointments.yes.line.t} en={appointments.yes.line.en} />
          </button>
          <button className="btn" onClick={() => answerAppointment(false)}>
            <Glossed text={appointments.no.line.t} en={appointments.no.line.en} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Intro({ setup }: { setup: ClockSetup }) {
  const { host, clock } = setup;
  const levelIndex = useClock((s) => s.levelIndex);
  const [lines] = useState(() => {
    const firstTime = !(getGame().save.shifts[host.id]?.stars.length ?? 0);
    return firstTime ? clock.lines.intro : [clock.lines.intro[clock.lines.intro.length - 1]];
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={CLOCK_LEVELS.length} onDone={beginClock} />;
}

function Summary({ setup }: { setup: ClockSetup }) {
  const { helped, customers, words, levelUp, levelIndex, late, timeLeft } = useClock((s) => s);
  const starter = useClockStarter(setup.host);
  const label = useWordLabel();
  const stars = clockStars(helped, customers.length, timeLeft);
  const { lines } = setup.clock;
  return (
    <JobSummary
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <Users size={18} /> {helped} / {customers.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveClock}
    />
  );
}
