"use client";

import { useCallback, useMemo, useState } from "react";
import { Camera, Ear, NotebookPen, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { FOREST_LEVELS, forestStars, type Habitat, type Weather } from "@/lib/game/forest";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { animalHead, hikerHead, hostHeadForest } from "./forest-room";
import { answer, beginForest, currentTask, forestRuntime, forestSetup, leaveForest, pardon, sayTask, startForest, taskLine, useForest, type ForestSetup } from "./forest-store";
import { JobBar, JobClock, JobIntro, JobLabel, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// The forester can use a hand once you know a few animals.
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
      animals: forest.animals.filter((a) => met(a.slug)).map((a) => a.slug),
      places: forest.places.filter((p) => met(p.concept)).map((p) => p.id) as Habitat[],
      weathers: forest.weathers.filter((w) => met(w.concepts[0])).map((w) => w.id) as Weather[],
      numbers: Object.entries(forest.numbers)
        .filter(([, slug]) => met(slug))
        .map(([n]) => Number(n)),
      hobbies: met(forest.likeFrame.concept) && forest.hobbies.filter((h) => met(h.concept)).length >= 2,
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = setup.animals.length >= 3;
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
      {status === "running" ? (
        <>
          <AnimalName setup={setup} />
          <Bubble setup={setup} />
          {task && task.kind !== "photo" ? <Logbook key={index} setup={setup} /> : null}
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
    <JobBar icon={<Camera size={22} />} title={lines.title} levelIndex={levelIndex} levels={FOREST_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveForest}>
      <span>
        <NotebookPen size={18} /> <strong>{done}</strong>
        <span className="shift-of">/ {tasks.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => forestRuntime.seconds / forestRuntime.total} />
    </JobBar>
  );
}

// While the survey is new, an animal says its name when you point at it.
function AnimalName({ setup }: { setup: ForestSetup }) {
  const heard = useForest((s) => s.level.heard);
  const sighting = useForest((s) => s.sightings.find((x) => x.id === s.hover) ?? null);
  if (heard || !sighting) return null;
  const name = setup.forest.animals.find((a) => a.slug === sighting.animal.slug)!.name;
  return <JobLabel id="animal-name" at={animalHead(sighting)} text={name.t} en={name.en} />;
}

// The forester whispering, or the hiker asking.
function Bubble({ setup }: { setup: ForestSetup }) {
  const { said, revealed, index } = useForest((s) => s);
  const task = useForest(() => currentTask());
  const current = useMemo(() => taskLine(task), [task]);
  const by = said?.by === "hiker" || (!said && current?.by === "hiker") ? "hiker" : "host";
  const where = useCallback(() => (by === "hiker" ? hikerHead() : hostHeadForest()), [by]);
  const ref = useShiftAnchor("forest-bubble", where, undefined, "side");
  if (!current && !said) return <div ref={ref} className="world-anchor" />;
  const name = by === "host" ? setup.host.name : null;
  const showLine = current && !said?.repeats && current.by === by;
  return (
    <div ref={ref} className="world-anchor">
      <div key={`${index}:${by}`} className={`shift-bubble ${said?.by === "player" ? "is-player" : ""}`}>
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
            <button className="icon-button" aria-label={aria(setup.forest.lines.repeat)} onClick={() => sayTask()}>
              <Volume2 size={16} />
            </button>
            <button className="shift-pardon" onClick={pardon}>
              <GlossedLine line={setup.forest.lines.repeat} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Counts, the weather and answers to the hiker, written in the logbook.
function Logbook({ setup }: { setup: ForestSetup }) {
  const [round, setRound] = useState(0);
  const task = useForest(() => currentTask());
  const weather = useForest((s) => s.weather);
  if (!task || task.kind === "photo") return null;
  const { forest } = setup;
  // The hint is the model answer: "Es sind drei Enten.", "Es regnet.", or a hobby sentence.
  const hint =
    task.kind === "count"
      ? (forest.counted(task.target.animal, task.target.count).parts?.[1] ?? "")
      : task.kind === "weather"
        ? forest.weathers.find((w) => w.id === weather)!.say.t
        : forest.lines.hobbyHint.t;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <NotebookPen size={18} /> <GlossedLine line={forest.lines.logbook} />
          {task.kind === "count" ? (
            <>
              {" · "}
              <GlossedLine line={forest.lines.countHow} />
            </>
          ) : null}
        </p>
        <FreeAnswer
          key={round}
          busy={false}
          hint={hint}
          onSubmit={async (text, via, hinted) => {
            answer(text, via, hinted);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

function Intro({ setup }: { setup: ForestSetup }) {
  const { host, forest } = setup;
  const levelIndex = useForest((s) => s.levelIndex);
  const [lines] = useState(() => {
    const firstTime = !(getGame().save.shifts[host.id]?.stars.length ?? 0);
    return firstTime ? forest.lines.intro : [forest.lines.intro[forest.lines.intro.length - 1]];
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
          <NotebookPen size={18} /> {done} / {tasks.length}
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
