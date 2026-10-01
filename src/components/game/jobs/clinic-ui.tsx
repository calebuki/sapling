"use client";

import { useCallback, useMemo, useState } from "react";
import { BedDouble, Check, Ear, GlassWater, Sofa, Stethoscope, Trash2, Users, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { CLINIC_LEVELS, clinicStars, type Advice, type HerbColor, type Reply, type Spoons } from "@/lib/game/clinic";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { COUNTER_Z, HERB_COLORS, JARS, JUG_X, KETTLE_X, SUGAR_X } from "./clinic-layout";
import { hostHeadClinic, patientHead } from "./clinic-room";
import {
  beginClinic,
  clinicRuntime,
  clinicSetup,
  currentPatient,
  emptyCauldron,
  finishBrew,
  getClinic,
  giveAdvice,
  leaveClinic,
  pardon,
  reply,
  sayStep,
  startClinic,
  stepLine,
  useClinic,
  type ClinicSetup,
} from "./clinic-store";
import { JobBar, JobClock, JobIntro, JobLabel, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// The doctor can use a hand once you know a few body parts and colours.
export function useClinicStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const clinic = pack.clinic;
    if (!clinic || clinic.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const parts = clinic.parts.filter((p) => met(p.slug)).map((p) => p.slug);
    const colors = clinic.colors.filter((c) => met(c.slug)).map((c) => c.slug);
    const spoons = ([1, 2, 3] as Spoons[]).filter((n) => met(clinic.numbers[n]));
    const advice = (Object.keys(clinic.advice) as Advice[]).filter((a) => clinic.advice[a]!.concepts.every(met) && (!clinic.adviceFrame || met(clinic.adviceFrame.concept)));
    const setup: ClinicSetup = {
      code: pack.code,
      host: villager,
      clinic,
      parts,
      colors,
      spoons: spoons.length ? spoons : [1],
      heat: met(clinic.heat.hot) && met(clinic.heat.cold),
      sugar: Boolean(clinic.sugar && met(clinic.sugar)),
      feelings: clinic.feelings.filter((f) => met(f.concept) && met(clinic.replies[f.reply].concept)).map((f) => f.concept),
      advice,
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = parts.length >= 4 && colors.length >= 2;
    return { ready, start: (level = save?.level ?? 0) => startClinic(setup, level), invite: clinic.lines.invite, notYet: clinic.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function ClinicUI() {
  const setup = clinicSetup();
  const status = useClinic((s) => s.status);
  const step = useClinic((s) => s.step);
  if (!setup) return null;
  return (
    <div className="shift">
      <ClinicTop setup={setup} />
      {status === "running" ? (
        <>
          <Labels setup={setup} />
          <Bubble setup={setup} />
          {step === "feeling" ? <ReplyPanel setup={setup} /> : null}
          {step === "where" ? (
            <p className="shift-how">
              <GlossedLine line={setup.clinic.lines.howTo} />
            </p>
          ) : null}
          {step === "brew" ? <PotPanel setup={setup} /> : null}
          {step === "advice" ? <AdvicePanel setup={setup} /> : null}
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function ClinicTop({ setup }: { setup: ClinicSetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useClinicStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, helped, patients } = useClinic((s) => s);
  const { lines } = setup.clinic;
  return (
    <JobBar icon={<Stethoscope size={22} />} title={lines.title} levelIndex={levelIndex} levels={CLINIC_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveClinic}>
      <span>
        <Users size={18} /> <strong>{helped}</strong>
        <span className="shift-of">/ {patients.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => clinicRuntime.seconds / clinicRuntime.total} />
    </JobBar>
  );
}

// Jar and water labels while the surgery is new.
function Labels({ setup }: { setup: ClinicSetup }) {
  const labels = useClinic((s) => s.level.labels);
  const step = useClinic((s) => s.step);
  if (!labels || step !== "brew") return null;
  const { clinic } = setup;
  return (
    <>
      {clinic.colors
        .filter((c) => setup.colors.includes(c.slug))
        .map((c) => (
          <JobLabel key={c.slug} id={`jar:${c.slug}`} at={[JARS[c.color], 2.15, COUNTER_Z]} text={c.word.t} en={c.word.en} />
        ))}
      <JobLabel id="kettle" at={[KETTLE_X, 2.1, COUNTER_Z]} text={clinic.lines.hot.t} en={clinic.lines.hot.en} />
      <JobLabel id="jug" at={[JUG_X, 2.1, COUNTER_Z]} text={clinic.lines.cold.t} en={clinic.lines.cold.en} />
      {setup.sugar ? <JobLabel id="sugar" at={[SUGAR_X, 1.85, COUNTER_Z]} text={clinic.lines.sugar.t} en={clinic.lines.sugar.en} /> : null}
    </>
  );
}

// Whoever is talking: the patient, or the doctor reading the recipe.
function Bubble({ setup }: { setup: ClinicSetup }) {
  const { said, revealed, step, index } = useClinic((s) => s);
  const patient = useClinic(() => currentPatient());
  // Derived here, not in a selector: a selector must not build a new object each read.
  const current = useMemo(() => stepLine(step, patient), [step, patient]);
  const by = current?.by ?? said?.by ?? "patient";
  const where = useCallback(() => {
    if (by === "host") return hostHeadClinic();
    const [x, y, z] = patientHead();
    // Close in, the bubble sits beside the face rather than above it.
    return getClinic().step === "where" ? ([x + 0.15, y - 0.45, z] as [number, number, number]) : ([x, y, z] as [number, number, number]);
  }, [by]);
  const ref = useShiftAnchor("clinic-bubble", where, undefined, "side");
  if (!current && !said) return <div ref={ref} className="world-anchor" />;
  const name = by === "host" ? setup.host.name : null;
  // A reaction that already repeats the line stands in for it.
  const showLine = current && !said?.repeats;
  return (
    <div ref={ref} className="world-anchor">
      <div key={`${index}:${step}:${by}`} className="shift-bubble">
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
            <button className="icon-button" aria-label={aria(setup.clinic.lines.repeat)} onClick={() => sayStep()}>
              <Volume2 size={16} />
            </button>
            <button className="shift-pardon" onClick={pardon}>
              <GlossedLine line={setup.clinic.lines.repeat} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReplyPanel({ setup }: { setup: ClinicSetup }) {
  const { clinic } = setup;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <GlossedLine line={clinic.lines.replyAsk} />
        </p>
        <div className="choice-grid">
          {(Object.keys(clinic.replies) as Reply[]).map((key) => (
            <button key={key} className="btn choice" onClick={() => reply(key)}>
              <Glossed text={clinic.replies[key].line.t} en={clinic.replies[key].line.en} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// What's in the cauldron so far, and "done".
function PotPanel({ setup }: { setup: ClinicSetup }) {
  const pot = useClinic((s) => s.pot);
  const { lines } = setup.clinic;
  const herbs = Object.entries(pot.herbs).filter(([, n]) => n) as Array<[HerbColor, number]>;
  const empty = !herbs.length && !pot.water && !pot.sugar;
  return (
    <div className="shift-tray clinic-pot" aria-label={aria(lines.pot)}>
      <GlossedLine line={lines.pot} className="cafe-board-title" />
      <div className="clinic-pot-items">
        {empty ? <span className="cafe-tray-empty">…</span> : null}
        {herbs.map(([color, n]) => (
          <span key={color} className="clinic-pot-chip">
            {Array.from({ length: n }, (_, i) => (
              <i key={i} style={{ background: HERB_COLORS[color] }} />
            ))}
          </span>
        ))}
        {pot.water ? <span className={`clinic-pot-chip is-water is-${pot.water}`}>💧</span> : null}
        {pot.sugar ? <span className="clinic-pot-chip is-sugar">{"◆".repeat(pot.sugar)}</span> : null}
      </div>
      <button className="btn btn-quiet shift-trash" disabled={empty} onClick={emptyCauldron}>
        <Trash2 size={17} /> <GlossedLine line={lines.empty} />
      </button>
      <button className="btn btn-primary shift-trash" disabled={empty} onClick={finishBrew}>
        <Check size={17} /> <GlossedLine line={lines.ready} />
      </button>
    </div>
  );
}

const adviceIcon: Record<Advice, React.ReactNode> = {
  bed: <BedDouble size={46} />,
  drink: <GlassWater size={46} />,
  rest: <Sofa size={46} />,
};

// The doctor's note shows a picture; you say what it means.
function AdvicePanel({ setup }: { setup: ClinicSetup }) {
  const patient = useClinic(() => currentPatient());
  const [round, setRound] = useState(0);
  if (!patient?.advice) return null;
  const advice = setup.clinic.advice[patient.advice]!;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <div className="clinic-note">
          <span className="clinic-note-icon">{adviceIcon[patient.advice]}</span>
          <p className="shift-hatch-line">
            <GlossedLine line={setup.clinic.lines.adviceTell} />
          </p>
        </div>
        <FreeAnswer
          key={round}
          busy={false}
          hint={advice.say.t}
          onSubmit={async (answer, via, hinted) => {
            giveAdvice(answer, via, hinted);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

function Intro({ setup }: { setup: ClinicSetup }) {
  const { host, clinic } = setup;
  const levelIndex = useClinic((s) => s.levelIndex);
  const [lines] = useState(() => {
    const firstTime = !(getGame().save.shifts[host.id]?.stars.length ?? 0);
    return firstTime ? clinic.lines.intro : [clinic.lines.intro[clinic.lines.intro.length - 1]];
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={CLINIC_LEVELS.length} onDone={beginClinic} />;
}

function Summary({ setup }: { setup: ClinicSetup }) {
  const { helped, patients, words, levelUp, levelIndex, late, timeLeft } = useClinic((s) => s);
  const starter = useClinicStarter(setup.host);
  const label = useWordLabel();
  const stars = clinicStars(helped, patients.length, timeLeft);
  const { lines } = setup.clinic;
  return (
    <JobSummary
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <Users size={18} /> {helped} / {patients.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveClinic}
    />
  );
}
