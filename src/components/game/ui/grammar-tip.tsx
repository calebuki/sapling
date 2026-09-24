"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Volume2, X } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import type { GrammarTip } from "@/lib/game/grammar";
import { expectedFor, meaningOf } from "@/lib/game/lesson";
import { getCourse } from "@/lib/learning/course";
import { getVillager } from "@/lib/game/villagers";
import { sound } from "../audio/sfx";
import { speakSwedish } from "../audio/speech";
import { emote, useGame } from "../store";
import { Sv, SvLine } from "./sv";

// A grammar tip takes the centre of the screen: it's a pause to understand,
// not another turn of conversation, so it sits above the dialogue box.
export function GrammarTipModal({
  tip,
  onDone,
  review = false,
}: {
  tip: GrammarTip;
  onDone: () => void;
  review?: boolean;
}) {
  const villager = getVillager(tip.villager);
  const model = useLearningModel();
  const name = useGame((s) => s.save.name);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [options] = useState(() => [...tip.check.options].sort(() => Math.random() - 0.5));
  // Show the phrases as the lessons will teach them, with the player's own name.
  const unlocked = useMemo(() => {
    const exercises = getCourse("sv").lessons.flatMap((l) => l.exercises);
    return tip.gates.flatMap((slug) => {
      const exercise = exercises.find((e) => e.conceptSlug === slug);
      const concept = model.concepts.find((c) => c.languageCode === "sv" && c.slug === slug);
      if (exercise) return [{ slug, sv: expectedFor(exercise, name), en: meaningOf(exercise, name) }];
      return concept ? [{ slug, sv: concept.canonicalForm, en: concept.gloss }] : [];
    });
  }, [tip, model.concepts, name]);
  const cards = tip.cards.length;
  const onCheck = step === cards;
  const onUnlock = step === cards + 1;
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    sound.play("open");
    emote(tip.villager, "think", 1800);
  }, [tip.villager]);
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
    // Reviewing an old tip skips the unlock screen: those phrases are already open.
    if (onCheck && (review || unlocked.length === 0)) return onDone();
    if (onUnlock) return onDone();
    setStep(step + 1);
  };

  const card = tip.cards[step];
  return createPortal(
    <div className="grammar-overlay" role="dialog" aria-modal="true" aria-label={tip.title.en}>
      <div className="grammar-card" style={{ "--accent": villager.look.accent } as React.CSSProperties}>
        <header className="grammar-head">
          <span className="grammar-badge">
            <GraduationCap size={16} /> <Sv text="Lilla grammatik" en="Little grammar" />
          </span>
          <button className="grammar-skip" onClick={onDone} aria-label="Hoppa över (skip)">
            {review ? <X size={18} /> : <Sv text="Hoppa över" en="Skip" />}
          </button>
        </header>
        <SvLine line={tip.title} as="h2" className="grammar-title" />
        <p className="grammar-teacher">
          <span className="dot" style={{ background: villager.look.accent }} /> {villager.name} · {tip.title.en}
        </p>

        {card ? (
          <section className="grammar-body" key={step}>
            <h3>
              <SvLine line={card.title} /> <span className="grammar-en">{card.title.en}</span>
            </h3>
            <p>{card.body}</p>
            <ul className="grammar-examples">
              {card.examples.map((example) => (
                <li key={example.sv}>
                  <button
                    className="icon-button"
                    aria-label="Lyssna (listen)"
                    onClick={() => void speakSwedish(example.sv.replace("→", ","), { who: tip.villager, pitch: villager.voicePitch })}
                  >
                    <Volume2 size={16} />
                  </button>
                  <Sv text={example.sv} en={example.en} className="grammar-sv" />
                  <span className="grammar-example-en">{example.en}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {onCheck ? (
          <section className="grammar-body" key="check">
            <h3>
              <Sv text="Testa!" en="Try it!" /> <span className="grammar-en">{tip.check.question}</span>
            </h3>
            <div className="choice-grid">
              {options.map((option) => {
                const state = picked === null ? "" : option === tip.check.answer ? "is-right" : option === picked ? "is-wrong" : "is-dim";
                return (
                  <button
                    key={option}
                    className={`btn choice ${state}`}
                    disabled={picked !== null}
                    onClick={() => {
                      setPicked(option);
                      const right = option === tip.check.answer;
                      sound.play(right ? "correct" : "wrong");
                      emote(tip.villager, right ? "happy" : "think", 1500);
                      void speakSwedish(tip.check.answer, { who: tip.villager, pitch: villager.voicePitch });
                    }}
                  >
                    <Sv text={option} />
                  </button>
                );
              })}
            </div>
            {picked !== null ? (
              <p className={`grammar-why ${picked === tip.check.answer ? "is-right" : ""}`} role="status">
                {picked === tip.check.answer ? <Check size={16} /> : null} {tip.check.why}
              </p>
            ) : null}
          </section>
        ) : null}

        {onUnlock ? (
          <section className="grammar-body grammar-unlock" key="unlock">
            <h3>
              <Sv text="Nu kan du säga…" en="Now you can say…" />
            </h3>
            <ul>
              {unlocked.map((phrase) => (
                <li key={phrase.slug}>
                  <button className="icon-button" aria-label="Lyssna (listen)" onClick={() => void speakSwedish(phrase.sv, { who: tip.villager, pitch: villager.voicePitch })}>
                    <Volume2 size={16} />
                  </button>
                  <Sv text={phrase.sv} en={phrase.en} className="grammar-sv" /> <span className="grammar-example-en">{phrase.en}</span>
                </li>
              ))}
            </ul>
            <p className="grammar-en">{villager.name} will practise these with you next.</p>
          </section>
        ) : null}

        <footer className="grammar-foot">
          <div className="grammar-dots" aria-hidden="true">
            {Array.from({ length: cards + 1 }, (_, i) => (
              <span key={i} className={i === Math.min(step, cards) ? "is-current" : i < step ? "is-done" : ""} />
            ))}
          </div>
          {step > 0 && !onUnlock ? (
            <button className="btn btn-quiet" onClick={() => { setPicked(null); setStep(step - 1); }}>
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <button ref={primary} className="btn btn-primary" disabled={onCheck && picked === null} onClick={next}>
            {onUnlock || (onCheck && (review || unlocked.length === 0)) ? (
              <Sv text="Då kör vi!" en="Let's go!" />
            ) : (
              <Sv text="Nästa" en="Next" />
            )}
            <ArrowRight size={18} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
