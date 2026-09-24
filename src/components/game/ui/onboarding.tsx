"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Compass, Sprout } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import type { AdaptiveActivity } from "@/lib/learning/adaptive";
import { getCourse } from "@/lib/learning/course";
import {
  answerPlacement,
  experienceOptions,
  placedBand,
  startPlacement,
  type Experience,
  type PlacementState,
} from "@/lib/game/placement";
import { getVillager, villagers } from "@/lib/game/villagers";
import { sound } from "../audio/sfx";
import { updateSave, useGame } from "../store";
import { ActivityView, type RecordFn } from "./lesson-round";
import { Sv, SvLine } from "./sv";

type Chosen = Exclude<Experience, "new">;
type Step =
  | { kind: "choose" }
  | { kind: "placement"; experience: Chosen; state: PlacementState }
  | { kind: "result"; experience: Chosen; band: number; right: number; total: number };

// First thing after stepping off the ferry: how much Swedish do you already have?
export function Onboarding() {
  const experience = useGame((s) => s.save.experience);
  const phase = useGame((s) => s.phase);
  const model = useLearningModel();
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const available = useMemo(() => {
    const course = new Set(getCourse("sv").lessons.flatMap((l) => l.exercises.map((e) => e.conceptSlug)));
    return new Set(model.concepts.filter((c) => c.languageCode === "sv" && course.has(c.slug)).map((c) => c.slug));
  }, [model.concepts]);

  if (experience !== null || phase !== "explore" || model.isLoading) return null;

  const choose = (id: Experience) => {
    sound.play("click");
    if (id === "new") {
      updateSave({ experience: "new", placedBand: 0, english: "auto" });
      return;
    }
    const state = startPlacement(id, available);
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
                <Compass size={16} /> <Sv text="Välkommen till Lilla Ö" en="Welcome to Little Island" />
              </span>
            </header>
            <h2 className="grammar-title">
              <Sv text="Har du lärt dig svenska förut?" en="Have you learned Swedish before?" />
            </h2>
            <p className="grammar-en">
              Using Duolingo? Pick the section you&apos;re on. Brand new learners start with the basics; everyone else takes a
              quick 2-minute check so we can skip what you already know.
            </p>
            <div className="experience-grid">
              {experienceOptions.map((option) => (
                <button key={option.id} className="btn experience" onClick={() => choose(option.id)}>
                  <SvLine line={option.title} as="strong" />
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
              const band = placedBand(state);
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
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const started = useRef(0);
  const course = getCourse("sv");
  const slug = state.queue[0];
  const band = villagers[state.band];

  const activity = useMemo((): AdaptiveActivity | null => {
    const concept = model.concepts.find((c) => c.languageCode === "sv" && c.slug === slug);
    const lesson = course.lessons.find((l) => l.exercises.some((e) => e.conceptSlug === slug));
    const exercise = lesson?.exercises.find((e) => e.conceptSlug === slug);
    if (!concept || !lesson || !exercise) return null;
    const listening = course.listenSpeakItems.find((i) => i.conceptSlug === slug);
    // Alternate hearing and building so the check samples both skills.
    const mode = listening && state.answers.length % 2 === 1 ? "listen" : "recall";
    return { id: `placement:${slug}`, conceptId: concept.id, lessonId: lesson.id, exercise, listening, mode, reason: "stretch" };
  }, [slug, state.answers.length, model.concepts, course]);

  useEffect(() => {
    started.current = performance.now();
  }, [state.answers.length]);

  const answer = async (correct: boolean) => {
    const next = answerPlacement(state, correct, available);
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
          context: { source: "placement", mode: activity.mode, input: p.input, band: state.band, villager: band.id },
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
          <Compass size={16} /> <Sv text="Snabbkoll" en="Quick check" />
        </span>
        <button className="grammar-skip" onClick={() => onDone({ ...state, done: true })}>
          <Sv text="Hoppa över" en="Skip" />
        </button>
      </header>
      <p className="grammar-teacher">
        <span className="dot" style={{ background: band.look.accent }} /> {band.name}&apos;s phrases · question {asked + 1}
      </p>
      <div className="lesson placement">
        {activity ? (
          <ActivityView
            key={activity.id + asked}
            activity={activity}
            villager={getVillager("elin")}
            name={null}
            state={undefined}
            pool={villagers.flatMap((v) => v.conceptSlugs).map((s) => model.concepts.find((c) => c.slug === s)?.canonicalForm ?? "").filter(Boolean)}
            busy={busy}
            onRecord={record}
          />
        ) : null}
        <div className="dialogue-actions">
          <button className="btn btn-quiet" disabled={busy} onClick={() => { sound.play("click"); void answer(false); }}>
            <Sv text="Jag vet inte" en="I don't know" />
          </button>
        </div>
      </div>
    </>
  );
}

const listNames = (names: string[]) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

function PlacementResult({ band, right, total, onDone }: { band: number; right: number; total: number; onDone: () => void }) {
  const start = villagers[band];
  return (
    <>
      <header className="grammar-head">
        <span className="grammar-badge">
          <Sprout size={16} /> <Sv text="Klart!" en="Done!" />
        </span>
      </header>
      <h2 className="grammar-title">
        {band === 0 ? (
          <Sv text="Vi börjar från början!" en="We'll start at the beginning!" />
        ) : (
          <Sv text={`Du börjar hos ${start.name}!`} en={`You start with ${start.name}!`} />
        )}
      </h2>
      <p className="grammar-en">
        You got {right} of {total} right.{" "}
        {band === 0
          ? "Elin on the dock will teach you the basics, with short grammar tips along the way."
          : `${listNames(villagers.slice(0, band + 1).map((v) => v.name))} are ready to talk. Say hi to Elin on the dock first, then head to ${start.name} at ${start.place.en.toLowerCase()}.`}
      </p>
      <ul className="placement-open">
        {villagers.map((v, i) => (
          <li key={v.id} className={i <= band ? "is-open" : ""}>
            <span className="dot" style={{ background: v.look.accent }} /> {v.name} · <Sv text={v.place.sv} en={v.place.en} />
          </li>
        ))}
      </ul>
      <p className="grammar-en grammar-note">
        Anything you got right already counts as practice. Anything you missed will come up in lessons, and nothing is marked
        as learned until you&apos;ve shown it.
      </p>
      <footer className="grammar-foot">
        <button className="btn btn-primary" autoFocus onClick={onDone}>
          <Sv text="Då kör vi!" en="Let's go!" /> <ArrowRight size={18} />
        </button>
      </footer>
    </>
  );
}
