"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { lessonFor, type JobLesson, type JobLessonCard } from "@/lib/game/job-lesson";
import type { Line } from "@/lib/game/line";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { sound } from "../audio/sfx";
import { speak } from "../audio/speech";
import { useIsland } from "../island";
import { emote } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";

// The little lesson before a job, in the grammar tip's card: how the job
// plays, its words to listen to, the grammar it leans on, then a quick check.

export function JobLessonModal({ host, lesson, levelIndex, onlyNew, onDone }: { host: Villager; lesson: JobLesson; levelIndex: number; onlyNew: boolean; onDone: () => void }) {
  const { ui, jobLessons } = useIsland();
  const words = useMetWords();
  // Word cards only show the words you've met; a card with none is left out.
  const [{ cards, check }] = useState(() => {
    const { cards, check } = lessonFor(lesson, levelIndex, onlyNew);
    return { cards: cards.filter((c) => c.kind !== "words" || words(c.slugs).length), check };
  });
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [options] = useState(() => (check ? [...check.options].sort(() => Math.random() - 0.5) : []));
  const onCheck = Boolean(check) && step === cards.length;
  const last = step === cards.length - (check ? 0 : 1);
  const primary = useRef<HTMLButtonElement>(null);
  const voice = { who: host.id, pitch: host.voicePitch };

  useEffect(() => {
    sound.play("open");
    emote(host.id, "think", 1800);
  }, [host.id]);
  useEffect(() => primary.current?.focus({ preventScroll: true }), [step]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onDone]);

  const next = () => {
    sound.play("click");
    if (last) onDone();
    else setStep(step + 1);
  };

  const card = cards[step];
  const labels = jobLessons?.labels;
  return createPortal(
    <div className="grammar-overlay" role="dialog" aria-modal="true" aria-label={labels?.badge.en}>
      <div className="grammar-card job-lesson" style={{ "--accent": host.look.accent } as React.CSSProperties}>
        <header className="grammar-head">
          <span className="grammar-badge">
            <GraduationCap size={16} /> {labels ? <GlossedLine line={labels.badge} /> : null}
          </span>
          <button className="grammar-skip" onClick={onDone} aria-label={aria(ui.skip)}>
            <GlossedLine line={ui.skip} />
          </button>
        </header>

        {card ? <LessonCard key={step} card={card} isNew={onlyNew || (levelIndex > 0 && (card.from ?? 0) === levelIndex)} voice={voice} words={words} newTag={labels?.newAtLevel} /> : null}

        {onCheck && check ? (
          <section className="grammar-body" key="check">
            <h3>
              <GlossedLine line={ui.tryIt} /> <span className="grammar-en">{check.question}</span>
            </h3>
            <div className="choice-grid">
              {options.map((option) => {
                const state = picked === null ? "" : option === check.answer ? "is-right" : option === picked ? "is-wrong" : "is-dim";
                return (
                  <button
                    key={option}
                    className={`btn choice ${state}`}
                    disabled={picked !== null}
                    onClick={() => {
                      setPicked(option);
                      const right = option === check.answer;
                      sound.play(right ? "correct" : "wrong");
                      emote(host.id, right ? "happy" : "think", 1500);
                      // A clock time is read off the clock, not said.
                      if (/\p{L}/u.test(check.answer)) void speak(check.answer, voice);
                    }}
                  >
                    <Glossed text={option} />
                  </button>
                );
              })}
            </div>
            {picked !== null ? (
              <p className={`grammar-why ${picked === check.answer ? "is-right" : ""}`} role="status">
                {picked === check.answer ? <Check size={16} /> : null} {check.why}
              </p>
            ) : null}
          </section>
        ) : null}

        <footer className="grammar-foot">
          <div className="grammar-dots" aria-hidden="true">
            {Array.from({ length: cards.length + (check ? 1 : 0) }, (_, i) => (
              <span key={i} className={i === step ? "is-current" : i < step ? "is-done" : ""} />
            ))}
          </div>
          {step > 0 ? (
            <button
              className="btn btn-quiet"
              aria-label={aria(ui.back)}
              onClick={() => {
                setPicked(null);
                setStep(step - 1);
              }}
            >
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <button ref={primary} className="btn btn-primary" disabled={onCheck && picked === null} onClick={next}>
            <GlossedLine line={last ? ui.letsGo : ui.next} />
            <ArrowRight size={18} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function LessonCard({
  card,
  isNew,
  voice,
  words,
  newTag,
}: {
  card: JobLessonCard;
  isNew: boolean;
  voice: { who: string; pitch: number };
  words: (slugs: string[]) => Line[];
  newTag?: Line;
}) {
  const { ui } = useIsland();
  const listen = (line: Line) => (
    <button className="icon-button" aria-label={aria(ui.listen)} onClick={() => void speak(line.t, voice)}>
      <Volume2 size={16} />
    </button>
  );
  return (
    <section className="grammar-body">
      <h3>
        <GlossedLine line={card.title} /> <span className="grammar-en">{card.title.en}</span>
        {isNew && newTag ? (
          <span className="job-lesson-new">
            <GlossedLine line={newTag} />
          </span>
        ) : null}
      </h3>
      {card.kind === "how" ? (
        <ol className="job-lesson-steps">
          {card.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {card.kind === "words" ? (
        <ul className="job-lesson-words">
          {words(card.slugs).map((word) => (
            <li key={word.t}>
              {listen(word)}
              <Glossed text={word.t} en={word.en} className="grammar-tl" />
              <span className="grammar-example-en">{word.en}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {card.kind === "grammar" ? (
        <>
          <p>{card.body}</p>
          <ul className="grammar-examples">
            {card.examples.map((example) => (
              <li key={example.t}>
                {listen(example)}
                <Glossed text={example.t} en={example.en} className="grammar-tl" />
                <span className="grammar-example-en">{example.en}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

// The course's words for these slugs, as the course writes them, keeping
// only those you've met (developer mode shows them all).
function useMetWords() {
  const { code } = useIsland();
  const model = useLearningModel();
  const dev = useDevMode();
  return useMemo(() => {
    const byslug = new Map(model.concepts.filter((c) => c.languageCode === code).map((c) => [c.slug, c]));
    const met = (id: string) => dev || (model.states.find((s) => s.conceptId === id)?.exposureCount ?? 0) > 0;
    return (slugs: string[]): Line[] =>
      slugs.flatMap((slug) => {
        const concept = byslug.get(slug);
        return concept && met(concept.id) ? [{ t: concept.canonicalForm, en: concept.gloss }] : [];
      });
  }, [model.concepts, model.states, code, dev]);
}

// The way into the lesson from the host's opening words.
export function JobLessonButton({ onOpen }: { onOpen: () => void }) {
  const { jobLessons } = useIsland();
  if (!jobLessons) return null;
  return (
    <button
      className="btn btn-quiet"
      onClick={() => {
        sound.play("click");
        onOpen();
      }}
    >
      <GraduationCap size={18} /> <GlossedLine line={jobLessons.labels.open} />
    </button>
  );
}

