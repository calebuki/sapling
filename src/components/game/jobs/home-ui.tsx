"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ear, Home as HomeIcon, Search, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { HOME_LEVELS, homeStars, type Spot } from "@/lib/game/home";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { FURNITURE } from "./home-layout";
import { hostHead, SPOT_LABEL_HEIGHT } from "./home-room";
import { beginHome, currentTask, homeRuntime, homeSetup, leaveHome, pardon, sayTask, startHome, tell, useHome, type HomeSetup } from "./home-store";
import { JobBar, JobClock, JobIntro, JobLabel, JobPanel, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// Whether this host can use a hand yet: it needs a few pieces of furniture,
// things to find and place words, all met in lessons first.
export function useHomeStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const home = pack.home;
    if (!home || home.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const spots = (Object.keys(home.prepositions) as Spot[]).filter((s) => met(home.prepositions[s].concept));
    const anchors = home.anchors.filter((a) => met(a.slug) && a.spots.some((s) => spots.includes(s))).map((a) => a.slug);
    const things = home.things.filter((t) => met(t.slug)).map((t) => t.slug);
    const ready = spots.length >= 2 && anchors.length >= 3 && things.length >= 2;
    const setup: HomeSetup = {
      code: pack.code,
      host: villager,
      home,
      anchors,
      things,
      spots,
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    return { ready, start: (level = save?.level ?? 0) => startHome(setup, level), invite: home.lines.invite, notYet: home.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function HomeUI() {
  const setup = homeSetup();
  const status = useHome((s) => s.status);
  if (!setup) return null;
  return (
    <div className="shift">
      <HomeTop setup={setup} />
      {status === "running" || status === "intro" ? <Labels setup={setup} /> : null}
      {status === "running" ? (
        <>
          <HostBubble setup={setup} />
          <TellPanel setup={setup} />
          <HowTo setup={setup} />
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function HomeTop({ setup }: { setup: HomeSetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useHomeStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, found, tasks } = useHome((s) => s);
  const { lines } = setup.home;
  return (
    <JobBar icon={<HomeIcon size={22} />} title={lines.title} levelIndex={levelIndex} levels={HOME_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveHome}>
      <span>
        <Search size={18} /> <strong>{found}</strong>
        <span className="shift-of">/ {tasks.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => homeRuntime.seconds / homeRuntime.total} />
    </JobBar>
  );
}

// Furniture names float over the furniture while the room is new.
function Labels({ setup }: { setup: HomeSetup }) {
  const labels = useHome((s) => s.level.labels);
  if (!labels) return null;
  return (
    <>
      {setup.home.anchors
        .filter((a) => setup.anchors.includes(a.slug))
        .map((a) => {
          const f = FURNITURE[a.model];
          return <JobLabel key={a.slug} id={`furniture:${a.slug}`} at={[f.x, SPOT_LABEL_HEIGHT[a.model], f.z]} text={a.name.t} en={a.name.en} />;
        })}
    </>
  );
}

// What the host wants, over their head: the request, or their reaction to what you did.
function HostBubble({ setup }: { setup: HomeSetup }) {
  const { home, host } = setup;
  const { said, reminded, revealed, index, searching } = useHome((s) => s);
  const task = useHome(() => currentTask());
  const where = useCallback(() => hostHead(), []);
  const ref = useShiftAnchor("home-host", where, undefined, "side");
  if (!task) return <div ref={ref} className="world-anchor" />;
  return (
    <div ref={ref} className="world-anchor">
      <div className="shift-bubble">
        <span className="home-bubble-name">{host.name}</span>
        {said ? (
          <p className="shift-said">
            <Glossed text={said.t} en={said.en} />
          </p>
        ) : null}
        {searching || reminded ? null : revealed ? (
          <p key={index} className={said ? "shift-order is-small" : "shift-order"}>
            <Glossed text={task.line.t} en={task.line.en} />
          </p>
        ) : (
          <p className="shift-order is-heard">
            <Ear size={18} /> …
          </p>
        )}
        <div className="shift-bubble-tools">
          <button className="icon-button" aria-label={aria(home.lines.repeat)} onClick={() => sayTask()}>
            <Volume2 size={16} />
          </button>
          <button className="shift-pardon" onClick={pardon}>
            <GlossedLine line={home.lines.repeat} />
          </button>
        </div>
      </div>
    </div>
  );
}

// "Wo ist mein Schlüssel?": you tell the host where it is, in words.
function TellPanel({ setup }: { setup: HomeSetup }) {
  const { home, host } = setup;
  const index = useHome((s) => s.index);
  const searching = useHome((s) => s.searching);
  const task = useHome(() => currentTask());
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);
  if (!task || task.kind !== "tell" || searching) return null;
  const hint = home.where(task.target.spot, task.target.anchor).t;
  // Slides down out of the way to look at the room, and back up to answer.
  return (
    <JobPanel key={index} host={host} label={home.lines.tell}>
      <FreeAnswer
        key={`${index}:${round}`}
        busy={busy}
        hint={hint}
        onSubmit={async (answer, via, hinted) => {
          setBusy(true);
          tell(answer, via, hinted);
          setBusy(false);
          setRound((r) => r + 1);
        }}
      />
    </JobPanel>
  );
}

function HowTo({ setup }: { setup: HomeSetup }) {
  const levelIndex = useHome((s) => s.levelIndex);
  const [show, setShow] = useState(levelIndex === 0);
  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => setShow(false), 14000);
    return () => window.clearTimeout(timer);
  }, [show]);
  return show ? (
    <p className="shift-how">
      <GlossedLine line={setup.home.lines.howTo} />
    </p>
  ) : null;
}

function Intro({ setup }: { setup: HomeSetup }) {
  const { host, home } = setup;
  const levelIndex = useHome((s) => s.levelIndex);
  const [lines] = useState(() => {
    const record = getGame().save.shifts[host.id];
    const firstTime = !(record?.stars.length ?? 0);
    const base = firstTime ? home.lines.intro : [home.lines.intro[home.lines.intro.length - 1]];
    // The first shift with "where is …?" questions explains them.
    const tellsNow = HOME_LEVELS[levelIndex].tells > 0;
    const toldBefore = (record?.stars ?? []).some((_, i) => HOME_LEVELS[i]?.tells > 0);
    return tellsNow && !toldBefore ? [...base, home.lines.tellIntro] : base;
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={HOME_LEVELS.length} onDone={beginHome} />;
}

function Summary({ setup }: { setup: HomeSetup }) {
  const { found, tasks, words, levelUp, gift, levelIndex, late, timeLeft } = useHome((s) => s);
  const starter = useHomeStarter(setup.host);
  const label = useWordLabel();
  const stars = homeStars(found, tasks.length, timeLeft);
  const { lines } = setup.home;
  return (
    <JobSummary
      gift={gift}
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <Search size={18} /> {found} / {tasks.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveHome}
    />
  );
}
