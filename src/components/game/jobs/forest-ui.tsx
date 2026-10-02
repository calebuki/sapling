"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ear, LifeBuoy, Radio, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { FOREST_LEVELS, forestStars, type Terrain, type Weather } from "@/lib/game/forest";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { hostHeadForest, tileTop } from "./forest-room";
import { answer, beginForest, currentTask, forestRuntime, forestSetup, leaveForest, pardon, sayTask, startForest, tileOf, useForest, type ForestSetup } from "./forest-store";
import { JobBar, JobClock, JobIntro, JobLabel, JobPanel, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// The forester can use a hand once you know a few places out in nature.
export function useForestStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const forest = pack.forest;
    if (!forest || forest.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const setup: ForestSetup = {
      code: pack.code,
      host: villager,
      forest,
      places: forest.places.filter((p) => met(p.concept)).map((p) => p.id) as Terrain[],
      weathers: forest.weathers.filter((w) => met(w.concepts[0])).map((w) => w.id) as Weather[],
      animals: forest.animals.filter((a) => met(a.slug)).map((a) => a.slug),
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = setup.places.length >= 3;
    return { ready, start: (level = save?.level ?? 0) => startForest(setup, level), invite: forest.lines.invite, notYet: forest.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function ForestUI() {
  const setup = forestSetup();
  const status = useForest((s) => s.status);
  const index = useForest((s) => s.index);
  const task = useForest(() => currentTask());
  if (!setup) return null;
  return (
    <div className="shift">
      <ForestTop setup={setup} />
      {status === "running" || status === "intro" ? <Labels setup={setup} /> : null}
      {status === "running" ? (
        <>
          <RadioCard setup={setup} />
          <HostBubble setup={setup} />
          {task?.kind === "weather" ? <WeatherPanel key={index} setup={setup} /> : <HowTo setup={setup} />}
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function ForestTop({ setup }: { setup: ForestSetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useForestStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, done, tasks } = useForest((s) => s);
  const { lines } = setup.forest;
  return (
    <JobBar icon={<LifeBuoy size={22} />} title={lines.title} levelIndex={levelIndex} levels={FOREST_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveForest}>
      <span>
        <LifeBuoy size={18} /> <strong>{done}</strong>
        <span className="shift-of">/ {tasks.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => forestRuntime.seconds / forestRuntime.total} />
    </JobBar>
  );
}

// Each place's name floats over it while the map is new.
function Labels({ setup }: { setup: ForestSetup }) {
  const labels = useForest((s) => s.level.labels);
  const tiles = useForest((s) => s.tiles);
  if (!labels) return null;
  return (
    <>
      {tiles.map((tile) => {
        const place = setup.forest.places.find((p) => p.id === tile.terrain)!;
        return <JobLabel key={tile.id} id={`tile:${tile.id}`} at={tileTop(tile.id, tiles.length)} text={place.name.t} en={place.name.en} />;
      })}
    </>
  );
}

// The hiker on the radio, in a card beside the map: what they said, or an
// ear until you ask "pardon?".
function RadioCard({ setup }: { setup: ForestSetup }) {
  const { revealed, index } = useForest((s) => s);
  const task = useForest(() => currentTask());
  if (task?.kind !== "call") return null;
  const { lines } = setup.forest;
  return (
    <div key={index} className="forest-radio" role="status">
      <span className="forest-radio-head">
        <Radio size={16} /> <GlossedLine line={lines.radio} /> · <strong>{task.caller.name}</strong>
      </span>
      {revealed ? (
        <p className="forest-radio-line">
          <Glossed text={task.line.t} en={task.line.en} />
        </p>
      ) : (
        <p className="forest-radio-line is-heard">
          <Ear size={20} /> …
        </p>
      )}
      <div className="shift-bubble-tools">
        <button className="icon-button" aria-label={aria(lines.repeat)} onClick={() => sayTask()}>
          <Volume2 size={16} />
        </button>
        <button className="shift-pardon" onClick={pardon}>
          <GlossedLine line={lines.repeat} />
        </button>
      </div>
    </div>
  );
}

// The forester: how it went, or his question about the weather.
function HostBubble({ setup }: { setup: ForestSetup }) {
  const { said, tiles } = useForest((s) => s);
  const n = tiles.length;
  const where = useCallback(() => hostHeadForest(n), [n]);
  const ref = useShiftAnchor("forest-host", where);
  if (!said) return <div ref={ref} className="world-anchor" />;
  return (
    <div ref={ref} className="world-anchor">
      <div key={said.t} className="shift-bubble">
        <span className="home-bubble-name">{setup.host.name}</span>
        <p className="shift-said">
          <Glossed text={said.t} en={said.en} />
        </p>
      </div>
    </div>
  );
}

// "Wie ist das Wetter am See?": you look at the map and tell him.
function WeatherPanel({ setup }: { setup: ForestSetup }) {
  const [round, setRound] = useState(0);
  const task = useForest(() => currentTask());
  if (task?.kind !== "weather") return null;
  const tile = tileOf(task.tile);
  const hint = setup.forest.weathers.find((w) => w.id === tile?.weather)?.say.t ?? "";
  return (
    <JobPanel host={setup.host} label={setup.forest.lines.tellWeather}>
      <FreeAnswer
        key={round}
        busy={false}
        hint={hint}
        onSubmit={async (text, via, hinted) => {
          answer(text, via, hinted);
          setRound((r) => r + 1);
        }}
      />
    </JobPanel>
  );
}

function HowTo({ setup }: { setup: ForestSetup }) {
  const levelIndex = useForest((s) => s.levelIndex);
  const [show, setShow] = useState(levelIndex === 0);
  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => setShow(false), 14000);
    return () => window.clearTimeout(timer);
  }, [show]);
  return show ? (
    <p className="shift-how">
      <GlossedLine line={setup.forest.lines.howTo} />
    </p>
  ) : null;
}

function Intro({ setup }: { setup: ForestSetup }) {
  const { host, forest } = setup;
  const levelIndex = useForest((s) => s.levelIndex);
  const [lines] = useState(() => {
    const record = getGame().save.shifts[host.id];
    const firstTime = !(record?.stars.length ?? 0);
    const base = firstTime ? forest.lines.intro : [forest.lines.intro[forest.lines.intro.length - 1]];
    // The first shift with weather questions explains them.
    const asksNow = FOREST_LEVELS[levelIndex].weather > 0;
    const askedBefore = (record?.stars ?? []).some((_, i) => FOREST_LEVELS[i]?.weather > 0);
    return asksNow && !askedBefore ? [...base, forest.lines.weatherIntro] : base;
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={FOREST_LEVELS.length} onDone={beginForest} />;
}

function Summary({ setup }: { setup: ForestSetup }) {
  const { done, tasks, words, levelUp, gift, levelIndex, late, timeLeft } = useForest((s) => s);
  const starter = useForestStarter(setup.host);
  const label = useWordLabel();
  const stars = forestStars(done, tasks.length, timeLeft);
  const { lines } = setup.forest;
  return (
    <JobSummary
      gift={gift}
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <LifeBuoy size={18} /> {done} / {tasks.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveForest}
    />
  );
}
