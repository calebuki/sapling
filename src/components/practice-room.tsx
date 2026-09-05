"use client";

import { Check, Coffee, Cookie, CupSoda, Leaf, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import townImage from "@/assets/home/lindbacken-storybook.png";
import { TargetAudioButton } from "@/components/target-audio-button";

const menu = [
  {
    id: "coffee",
    target: "en kaffe",
    english: "a coffee",
    icon: Coffee,
    clip: "sv-learn-kaffe",
  },
  {
    id: "tea",
    target: "en kopp te",
    english: "a cup of tea",
    icon: CupSoda,
    clip: "sv-learn-te",
  },
  {
    id: "bun",
    target: "en kanelbulle",
    english: "a cinnamon bun",
    icon: Cookie,
    clip: "sv-learn-kanelbulle",
  },
];

export function PracticeRoom({
  sceneId,
  name,
  dialogue,
  english,
  translationVisible,
  onTranslate,
  onHint,
  busy,
}: {
  sceneId: string;
  name: string;
  dialogue: string;
  english: string;
  translationVisible: boolean;
  onTranslate: () => void;
  onHint: () => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const cafe = sceneId === "fika-order" || sceneId === "meet-elin";
  const theme = cafe
    ? "cafe"
    : sceneId.includes("station")
      ? "station"
      : "park";
  const item = menu.find((option) => option.id === selected);
  return (
    <div className={`life-room room-${theme}`}>
      <div className="life-room-scenery" aria-hidden="true">
        <div className="life-room-window">
          <Image src={townImage} alt="" fill sizes="440px" />
          <span />
        </div>
        <div className="life-room-sign">
          {cafe
            ? "Kafé Linden"
            : theme === "station"
              ? "Centralstationen"
              : "Stadsparken"}
        </div>
        <div className="life-room-plant">
          <Leaf size={50} strokeWidth={1} />
        </div>
        <div className="life-room-lamp" />
      </div>
      <div className="life-character" aria-label={name} role="img">
        <div className="life-character-hair" />
        <div className="life-character-face">
          <span className="life-character-eyes" />
          <span className="life-character-smile" />
        </div>
        <div className="life-character-body" />
        <span className="life-character-name">{name}</span>
      </div>
      <div className="life-dialogue" aria-live="polite">
        <span className="life-small-label">{name}</span>
        <p lang="sv">{dialogue}</p>
        {translationVisible ? (
          <p className="life-translation">{english}</p>
        ) : (
          <button
            type="button"
            className="life-text-link"
            onClick={onTranslate}
          >
            Show English
          </button>
        )}
      </div>
      {cafe ? (
        <div className="life-counter">
          <span className="life-counter-label">
            På menyn <small>On the menu</small>
          </span>
          <div className="life-menu-items">
            {menu.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  type="button"
                  key={option.id}
                  disabled={busy}
                  aria-pressed={selected === option.id}
                  onClick={() => {
                    setSelected(selected === option.id ? null : option.id);
                    onHint();
                  }}
                >
                  <Icon size={26} strokeWidth={1.5} />
                  <span>{option.english.replace(/^an? /, "")}</span>
                </button>
              );
            })}
          </div>
          {item ? (
            <div className="life-menu-detail">
              <span>
                <strong lang="sv">{item.target}</strong>
                <small>{item.english}</small>
              </span>
              <TargetAudioButton
                key={item.clip}
                clipId={item.clip}
                languageName="Swedish"
                label="Hear it"
                onPlay={onHint}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="life-room-ground" />
      )}
    </div>
  );
}

export function PhraseWarmup({
  scenarioId,
  onReady,
}: {
  scenarioId: string;
  onReady: () => void;
}) {
  const target =
    scenarioId === "fika-order"
      ? "Jag skulle vilja ha en kaffe tack"
      : scenarioId === "meet-elin"
        ? "Hej jag heter Elin"
        : scenarioId.includes("station")
          ? "Var ligger stationen"
          : "Ska vi ta en fika";
  const words = target.split(" ");
  const bank = words
    .map((word, index) => ({ word, index }))
    .sort(
      (a, b) =>
        ((a.index * 7 + 3) % (words.length + 1)) -
        ((b.index * 7 + 3) % (words.length + 1)),
    );
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const correct =
    chosen.length === words.length &&
    chosen.every((index, position) => words[index] === words[position]);
  const prompt =
    scenarioId === "fika-order"
      ? "I would like a coffee, please."
      : scenarioId === "meet-elin"
        ? "Hello, my name is Elin."
        : scenarioId.includes("station")
          ? "Where is the station?"
          : "Shall we have a fika?";
  return (
    <section className="life-warmup">
      <p className="life-eyebrow">A little warm-up</p>
      <h3>{prompt}</h3>
      <div className="life-word-answer" aria-label="Your sentence">
        {chosen.length ? (
          chosen.map((index, position) => (
            <button
              type="button"
              key={index}
              onClick={() => {
                setChosen(chosen.filter((_, i) => i !== position));
                setChecked(false);
              }}
            >
              {words[index]}
            </button>
          ))
        ) : (
          <span>Tap the words to build your sentence.</span>
        )}
      </div>
      <div className="life-word-bank" aria-label="Available words">
        {bank.map(({ word, index }) => (
          <button
            key={index}
            type="button"
            disabled={chosen.includes(index)}
            onClick={() => {
              setChosen([...chosen, index]);
              setChecked(false);
            }}
          >
            {word}
          </button>
        ))}
      </div>
      <div className="life-warmup-actions">
        <button
          className="life-button life-button-outline"
          type="button"
          onClick={() => {
            setChosen([]);
            setChecked(false);
          }}
          aria-label="Reset sentence"
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="life-button"
          type="button"
          onClick={() => (correct && checked ? onReady() : setChecked(true))}
          disabled={chosen.length !== words.length}
        >
          {correct && checked ? (
            <>
              Use it with Elin
              <ArrowIcon />
            </>
          ) : (
            "Check sentence"
          )}
        </button>
      </div>
      {checked ? (
        <p
          className={`life-warmup-feedback ${correct ? "is-correct" : ""}`}
          role="status"
        >
          {correct ? (
            <>
              <Check size={16} />
              That’s it. Now make it your own.
            </>
          ) : (
            "Almost. Tap a word in your sentence to move it back."
          )}
        </p>
      ) : null}
    </section>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true">→</span>;
}
