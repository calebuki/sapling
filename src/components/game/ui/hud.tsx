"use client";

import { BookOpen, Menu, Sparkles, Target, Volume2, VolumeX } from "lucide-react";
import { getDiscovery } from "@/lib/game/discoveries";
import type { GameProgress } from "@/lib/game/progression";
import { ui } from "@/lib/game/ui-text";
import { getVillager } from "@/lib/game/villagers";
import { interact } from "../actions";
import { sound } from "../audio/sfx";
import { setGame, useGame } from "../store";
import { SvLine } from "./sv";

export function Hud({ progress }: { progress: GameProgress }) {
  const phase = useGame((s) => s.phase);
  const nearby = useGame((s) => s.nearby);
  const muted = useGame((s) => s.muted);
  const introDone = useGame((s) => s.save.introDone);
  const discovered = useGame((s) => s.save.discovered);
  if (phase === "title") return null;

  const goalVillager = progress.goal ? getVillager(progress.goal) : null;
  const goal = !introDone
    ? ui.goalMeetElin
    : goalVillager
      ? progress.villagers[goalVillager.id].met > 0
        ? ui.goalLearnMore(goalVillager.name)
        : ui.goalTalk(goalVillager.name, goalVillager.place)
      : ui.goalDone;
  const ring = 2 * Math.PI * 22;

  let prompt = null;
  if (phase === "explore" && nearby) {
    if (nearby.kind === "villager") prompt = ui.talkTo(getVillager(nearby.id).name);
    else {
      const item = getDiscovery(nearby.id)!;
      prompt = discovered.includes(item.id) ? { sv: item.sv, en: item.en } : ui.lookAt;
    }
  }

  return (
    <>
      <div className="hud-top-left">
        <div className="level-badge" aria-label={`Nivå ${progress.level} (level ${progress.level})`}>
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
          <SvLine line={ui.level} as="span" className="level-label" />
          <span className="level-words">
            {progress.wordsMet}/{progress.wordsTotal} <SvLine line={ui.words} /> · {discovered.length} <Sparkles size={12} />
          </span>
        </div>
      </div>
      {phase === "explore" ? (
        <div className="hud-goal">
          <Target size={15} aria-hidden="true" />
          <SvLine line={goal} />
        </div>
      ) : null}

      <div className="hud-top-right">
        <button className="hud-button" aria-label="Ordbok (dictionary)" onClick={() => { sound.play("open"); setGame({ overlay: "ordbok" }); }}>
          <BookOpen size={20} />
          <SvLine line={ui.dictionary} className="hud-button-label" />
        </button>
        <button
          className="hud-button"
          aria-label={muted ? "Ljud på (sound on)" : "Ljud av (sound off)"}
          onClick={() => {
            const next = !muted;
            sound.setMuted(next);
            setGame({ muted: next });
          }}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button className="hud-button" aria-label="Meny (menu)" onClick={() => { sound.play("open"); setGame({ overlay: "menu" }); }}>
          <Menu size={20} />
        </button>
      </div>

      {prompt && nearby ? (
        <button className="hud-prompt" onClick={() => interact(nearby)}>
          <kbd>E</kbd>
          <SvLine line={prompt} />
        </button>
      ) : null}

      {phase === "explore" && !introDone && !prompt ? (
        <div className="hud-hint">
          <SvLine line={ui.walkHint} />
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
          <SvLine line={t.line} as="strong" />
          {t.detail ? <SvLine line={t.detail} as="span" className="toast-detail" /> : null}
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
