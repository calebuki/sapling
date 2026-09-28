"use client";

import Link from "next/link";
import { BookOpen, Home, Menu, Sparkles, Target, Volume2, VolumeX } from "lucide-react";
import type { GameProgress } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import { interact } from "../actions";
import { sound } from "../audio/sfx";
import { villagerById, useIsland } from "../island";
import { setGame, useGame } from "../store";
import { GlossedLine } from "./glossed";

export function Hud({ progress }: { progress: GameProgress }) {
  const phase = useGame((s) => s.phase);
  const nearby = useGame((s) => s.nearby);
  const muted = useGame((s) => s.muted);
  const introDone = useGame((s) => s.save.introDone);
  const discovered = useGame((s) => s.save.discovered);
  const { ui, discoveries } = useIsland();
  if (phase === "title") return null;

  const goalVillager = progress.goal ? villagerById(progress.goal) : null;
  const goal = !introDone
    ? ui.goalMeetFirst
    : goalVillager
      ? progress.villagers[goalVillager.id].met > 0
        ? ui.goalLearnMore(goalVillager.name)
        : ui.goalTalk(goalVillager.name, goalVillager.place)
      : ui.goalDone;
  const ring = 2 * Math.PI * 22;

  let prompt = null;
  if (phase === "explore" && nearby) {
    if (nearby.kind === "villager") prompt = ui.talkTo(villagerById(nearby.id).name);
    else {
      const item = discoveries.find((d) => d.id === nearby.id)!;
      prompt = discovered.includes(item.id) ? { t: item.t, en: item.en } : ui.lookAt;
    }
  }

  return (
    <>
      <div className="hud-top-left">
        <div className="level-badge" aria-label={`${ui.level.t} ${progress.level} (level ${progress.level})`}>
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="22" className="level-track" />
            <circle
              cx="26"
              cy="26"
              r="22"
              className="level-fill"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - progress.progress)}
            />
          </svg>
          <strong>{progress.level}</strong>
        </div>
        <div className="level-text">
          <GlossedLine line={ui.level} as="span" className="level-label" />
          <span className="level-words">
            {progress.wordsMet}/{progress.wordsTotal} <GlossedLine line={ui.words} /> · {discovered.length} <Sparkles size={12} />
          </span>
        </div>
      </div>
      {phase === "explore" ? (
        <div className="hud-goal">
          <Target size={15} aria-hidden="true" />
          <GlossedLine line={goal} />
        </div>
      ) : null}

      <div className="hud-top-right">
        <Link className="hud-button" href="/" aria-label={aria(ui.home)} onClick={() => sound.play("click")}>
          <Home size={20} />
        </Link>
        <button className="hud-button" aria-label={aria(ui.dictionary)} onClick={() => { sound.play("open"); setGame({ overlay: "ordbok" }); }}>
          <BookOpen size={20} />
          <GlossedLine line={ui.dictionary} className="hud-button-label" />
        </button>
        <button
          className="hud-button"
          aria-label={aria(muted ? ui.soundOn : ui.soundOff)}
          onClick={() => {
            const next = !muted;
            sound.setMuted(next);
            setGame({ muted: next });
          }}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button className="hud-button" aria-label={aria(ui.menu)} onClick={() => { sound.play("open"); setGame({ overlay: "menu" }); }}>
          <Menu size={20} />
        </button>
      </div>

      {prompt && nearby ? (
        <button className="hud-prompt" onClick={() => interact(nearby)}>
          <kbd>E</kbd>
          <GlossedLine line={prompt} />
        </button>
      ) : null}

      {phase === "explore" && !introDone && !prompt ? (
        <div className="hud-hint">
          <GlossedLine line={ui.walkHint} />
        </div>
      ) : null}
    </>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.kind === "level" ? <Confetti /> : null}
          <GlossedLine line={t.line} as="strong" />
          {t.detail ? <GlossedLine line={t.detail} as="span" className="toast-detail" /> : null}
        </div>
      ))}
    </div>
  );
}

const confettiColors = ["#ffc93c", "#ff7aa2", "#3aa56b", "#3f7fd1", "#b58cff", "#ffffff"];

function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const distance = 90 + (i % 5) * 28;
        return (
          <i
            key={i}
            style={
              {
                background: confettiColors[i % confettiColors.length],
                "--dx": `${Math.cos(angle) * distance}px`,
                "--dy": `${Math.sin(angle) * distance * 0.7 + 40}px`,
                "--spin": `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                animationDelay: `${(i % 4) * 30}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
