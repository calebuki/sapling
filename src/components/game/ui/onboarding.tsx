"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Compass, Sprout } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import type { AdaptiveActivity } from "@/lib/learning/adaptive";
import { getTargetLanguage } from "@/lib/learning/languages";
import {
  answerPlacement,
  placedBand,
  startPlacement,
  unitsInBand,
  type Experience,
  type PlacementState,
} from "@/lib/game/placement";
import { sound } from "../audio/sfx";
import { villagerById, useIsland } from "../island";
import { updateSave, useGame } from "../store";
import { ActivityView, type RecordFn } from "./lesson-round";
import { Glossed, GlossedLine } from "./glossed";

type Chosen = Exclude<Experience, "new">;
type Step =
  | { kind: "choose" }
  | { kind: "placement"; experience: Chosen; state: PlacementState }
  | { kind: "result"; experience: Chosen; band: number; right: number; total: number };

// First thing after stepping off the ferry: how much of the language do you already have?
export function Onboarding() {
  const experience = useGame((s) => s.save.experience);
  const phase = useGame((s) => s.phase);
  const model = useLearningModel();
  const { code, course, placement, ui } = useIsland();
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const available = useMemo(() => {
    const taught = new Set(course.lessons.flatMap((l) => l.exercises.map((e) => e.conceptSlug)));
    return new Set(model.concepts.filter((c) => c.languageCode === code && taught.has(c.slug)).map((c) => c.slug));
  }, [model.concepts, code, course]);

  if (experience !== null || phase !== "explore" || model.isLoading) return null;

  const choose = (id: Experience) => {
    sound.play("click");
    if (id === "new") {
      updateSave({ experience: "new", placedBand: 0, english: "auto" });
      return;
    }
    const state = startPlacement(placement, course.units, id, available);
    if (state.queue.length === 0) {
      updateSave({ experience: id, placedBand: 0 });
      return;
    }
    setStep({ kind: "placement", experience: id, state });
  };

  return createPortal(
    <div className="grammar-overlay onboarding" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="grammar-card onboarding-card">
        {step.kind === "choose" ? (
          <>
            <header className="grammar-head">
              <span className="grammar-badge">
                <Compass size={16} /> <GlossedLine line={ui.welcomeTitle} />
              </span>
            </header>
            <h2 className="grammar-title">
              <GlossedLine line={ui.learnedBefore} />
            </h2>
            <p className="grammar-en">
              Using Duolingo? Pick the section you&apos;re on. Brand new learners start with the basics; everyone else takes a
              quick 2-minute check so we can skip what you already know.
            </p>
            <div className="experience-grid">
              {placement.options.map((option) => (
                <button key={option.id} className="btn experience" onClick={() => choose(option.id)}>
                  <GlossedLine line={option.title} as="strong" />
                  <span className="experience-en">{option.title.en}</span>
                  <span className="experience-detail">{option.detail}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step.kind === "placement" ? (
          <PlacementRun
            state={step.state}
            available={available}
            onDone={(state) => {
              const band = placedBand(placement, state);
              setStep({ kind: "result", experience: step.experience, band, right: state.answers.filter((a) => a.correct).length, total: state.answers.length });
            }}
          />
        ) : null}

        {step.kind === "result" ? (
          <PlacementResult
            band={step.band}
            right={step.right}
            total={step.total}
            onDone={() => {
              sound.play("sparkle");
              updateSave({ experience: step.experience, placedBand: step.band, english: "auto" });
            }}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function PlacementRun({
  state: initial,
  available,
  onDone,
}: {
  state: PlacementState;
  available: ReadonlySet<string>;
  onDone: (state: PlacementState) => void;
}) {
  const model = useLearningModel();
  const { code, course, placement, ui, host } = useIsland();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const started = useRef(0);
  const slug = state.queue[0];
  const bandUnit = unitsInBand(placement, course.units, state.band)[0];
  const teacher = villagerById(bandUnit?.villager ?? host);

  const activity = useMemo((): AdaptiveActivity | null => {
    const concept = model.concepts.find((c) => c.languageCode === code && c.slug === slug);
    const lesson = course.lessons.find((l) => l.exercises.some((e) => e.conceptSlug === slug));
    const exercise = lesson?.exercises.find((e) => e.conceptSlug === slug);
    if (!concept || !lesson || !exercise) return null;
    const listening = course.listenSpeakItems.find((i) => i.conceptSlug === slug);
    // Alternate hearing and building so the check samples both skills.
    const mode = listening && state.answers.length % 2 === 1 ? "listen" : "recall";
    return { id: `placement:${slug}`, conceptId: concept.id, lessonId: lesson.id, exercise, listening, mode, reason: "stretch" };
  }, [slug, state.answers.length, model.concepts, course, code]);

  const pool = useMemo(
    () => course.units.flatMap((u) => u.slugs).map((s) => model.concepts.find((c) => c.languageCode === code && c.slug === s)?.canonicalForm ?? "").filter(Boolean),
    [course, model.concepts, code],
  );

  useEffect(() => {
    started.current = performance.now();
  }, [state.answers.length]);

  const answer = async (correct: boolean) => {
    const next = answerPlacement(placement, course.units, state, correct, available);
    if (next.done || next.queue.length === 0) onDone({ ...next, done: true });
    else setState(next);
  };

  const record: RecordFn = async (p) => {
    if (!activity || busy) return;
    setBusy(true);
    sound.play(p.successful ? "correct" : "tile");
    // Only real successes become evidence; a miss just means "teach this later".
    if (p.successful && !p.assisted) {
      try {
        await model.recordObservation({
          attemptId: crypto.randomUUID(),
          conceptId: activity.conceptId,
          dimension: activity.mode === "listen" ? "recognitionAudio" : "recall",
          successful: true,
          assisted: false,
          latencyMs: Math.round(performance.now() - started.current),
          response: p.response,
          expected: p.expected,
          context: { source: "placement", mode: activity.mode, input: p.input, band: state.band, villager: teacher.id },
        });
      } catch {
        // Placement still works offline; the lesson will pick this up again.
      }
    }
    setBusy(false);
    await answer(p.successful && !p.assisted);
  };

  const asked = state.answers.length;
  return (
    <>
      <header className="grammar-head">
        <span className="grammar-badge">
          <Compass size={16} /> <GlossedLine line={ui.quickCheck} />
        </span>
        <button className="grammar-skip" onClick={() => onDone({ ...state, done: true })}>
          <GlossedLine line={ui.skip} />
        </button>
      </header>
      <p className="grammar-teacher">
        <span className="dot" style={{ background: teacher.look.accent }} /> {bandUnit?.title.en ?? teacher.name} · question {asked + 1}
      </p>
      <div className="lesson placement">
        {activity ? (
          <ActivityView
            key={activity.id + asked}
            activity={activity}
            villager={villagerById(host)}
            name={null}
            state={undefined}
            pool={pool}
            busy={busy}
            onRecord={record}
          />
        ) : null}
        <div className="dialogue-actions">
          <button className="btn btn-quiet" disabled={busy} onClick={() => { sound.play("click"); void answer(false); }}>
            <GlossedLine line={ui.dontKnow} />
          </button>
        </div>
      </div>
    </>
  );
}

const listNames = (names: string[]) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

function PlacementResult({ band, right, total, onDone }: { band: number; right: number; total: number; onDone: () => void }) {
  const { code, course, placement, ui, host } = useIsland();
  const opened = course.units.slice(0, placement.bands[band + 1] ?? course.units.length);
  const start = villagerById(unitsInBand(placement, course.units, band)[0]?.villager ?? host);
  const first = villagerById(host);
  const people = [...new Set(opened.map((u) => u.villager))].map(villagerById);
  return (
    <>
      <header className="grammar-head">
        <span className="grammar-badge">
          <Sprout size={16} /> <GlossedLine line={ui.done} />
        </span>
      </header>
      <h2 className="grammar-title">
        <GlossedLine line={band === 0 ? ui.startFromTop : ui.startWith(start.name)} />
      </h2>
      <p className="grammar-en">
        You got {right} of {total} right.{" "}
        {band === 0
          ? `${first.name} will teach you the basics of ${getTargetLanguage(code).name}, with short grammar tips along the way.`
          : `${listNames(people.map((v) => v.name))} are ready to talk. Say hi to ${first.name} first, then head to ${start.name} at ${start.place.en.toLowerCase()}.`}
      </p>
      <ul className="placement-open">
        {course.units.map((unit, i) => {
          const teacher = villagerById(unit.villager);
          return (
            <li key={unit.id} className={i < opened.length ? "is-open" : ""}>
              <span className="dot" style={{ background: teacher.look.accent }} /> <Glossed text={unit.title.t} en={unit.title.en} /> · {teacher.name}
            </li>
          );
        })}
      </ul>
      <p className="grammar-en grammar-note">
        Anything you got right already counts as practice. Anything you missed will come up in lessons, and nothing is marked
        as learned until you&apos;ve shown it.
      </p>
      <footer className="grammar-foot">
        <button className="btn btn-primary" autoFocus onClick={onDone}>
          <GlossedLine line={ui.letsGo} /> <ArrowRight size={18} />
        </button>
      </footer>
    </>
  );
}
