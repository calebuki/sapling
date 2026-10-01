"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Star, X } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import type { Line } from "@/lib/game/line";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { sound } from "../audio/sfx";
import { speak } from "../audio/speech";
import { useIsland } from "../island";
import { Glossed, GlossedLine } from "../ui/glossed";
import { useShiftAnchor } from "./anchors";

// The screens every job shares: the bar along the top, names floating over
// the room, the host's opening words and the end-of-shift card.

export function JobBar({
  icon,
  title,
  levelIndex,
  levels,
  children,
  onClose,
}: {
  icon: ReactNode;
  title: Line;
  levelIndex: number;
  levels: number;
  children: ReactNode;
  onClose: () => void;
}) {
  const { ui } = useIsland();
  return (
    <div className="shift-top">
      <div className="shift-title">
        {icon}
        <GlossedLine line={title} />
        <span className="shift-pips" aria-label={`${levelIndex + 1} / ${levels}`}>
          {Array.from({ length: levels }, (_, i) => (
            <i key={i} className={i <= levelIndex ? "is-on" : ""} />
          ))}
        </span>
      </div>
      <div className="shift-score">{children}</div>
      <button className="hud-button" aria-label={aria(ui.close)} onClick={onClose}>
        <X size={20} />
      </button>
    </div>
  );
}

// A word pinned over something in the room.
export function JobLabel({ id, at, text, en }: { id: string; at: [number, number, number]; text: string; en: string }) {
  const [x, y, z] = at;
  const where = useCallback((): [number, number, number] => [x, y, z], [x, y, z]);
  const ref = useShiftAnchor(id, where);
  return (
    <div ref={ref} className="world-anchor">
      <div className="shift-label">
        <Glossed text={text} en={en} />
      </div>
    </div>
  );
}

// The host explains, one line at a time; returning helpers only hear the last.
export function JobIntro({ host, lines, levelIndex, levels, onDone }: { host: Villager; lines: Line[]; levelIndex: number; levels: number; onDone: () => void }) {
  const { ui } = useIsland();
  const [index, setIndex] = useState(0);
  const line = lines[index];
  useEffect(() => {
    void speak(line.t, { who: host.id, pitch: host.voicePitch });
  }, [line.t, host]);
  const last = index === lines.length - 1;
  return (
    <div className="dialogue shift-intro" role="dialog" aria-label={host.name}>
      <div className="dialogue-plate">
        <span className="dialogue-name" style={{ background: host.look.accent }}>
          {host.name}
        </span>
        <span className="dialogue-role shift-level-tag">
          {levelIndex + 1} / {levels}
        </span>
      </div>
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <Glossed text={line.t} en={line.en} />
        </p>
        <div className="dialogue-actions">
          <button
            className="btn btn-primary"
            autoFocus
            onClick={() => {
              sound.play("click");
              if (last) onDone();
              else setIndex(index + 1);
            }}
          >
            <GlossedLine line={last ? ui.letsGo : ui.next} /> <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Words practised this shift: slug → [right, total], labelled from the course.
export function useWordLabel(own?: (slug: string) => Line | null) {
  const { code } = useIsland();
  const model = useLearningModel();
  return (slug: string): Line => {
    const mine = own?.(slug);
    if (mine) return mine;
    const concept = model.concepts.find((c) => c.languageCode === code && c.slug === slug);
    return concept ? { t: concept.canonicalForm, en: concept.gloss } : { t: slug, en: slug };
  };
}

export function JobSummary({
  title,
  stars,
  line,
  stats,
  words,
  label,
  harder,
  again,
  back,
  onAgain,
  onBack,
}: {
  title: Line;
  stars: number;
  line: Line;
  stats: ReactNode;
  words: Record<string, [number, number]>;
  label: (slug: string) => Line;
  harder: Line | null;
  again: Line;
  back: Line;
  onAgain: () => void;
  onBack: () => void;
}) {
  return (
    <div className="shift-summary" role="dialog" aria-label={title.en}>
      <div className="shift-stars" aria-label={`${stars} / 3`}>
        {[0, 1, 2].map((i) => (
          <Star key={i} size={46} className={i < stars ? "is-on" : ""} />
        ))}
      </div>
      <h2>
        <Glossed text={line.t} en={line.en} />
      </h2>
      <p className="shift-summary-score">{stats}</p>
      {Object.keys(words).length ? (
        <ul className="shift-words">
          {Object.entries(words).map(([slug, [right, total]]) => (
            <li key={slug} className={right === total ? "is-right" : "is-mixed"}>
              <Glossed text={label(slug).t} en={label(slug).en} />
              <span>
                {right}/{total}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {harder ? (
        <p className="shift-harder">
          <GlossedLine line={harder} />
        </p>
      ) : null}
      <div className="dialogue-actions">
        <button className="btn btn-primary" autoFocus onClick={onAgain}>
          <GlossedLine line={again} /> <ArrowRight size={18} />
        </button>
        <button className="btn" onClick={onBack}>
          <GlossedLine line={back} />
        </button>
      </div>
    </div>
  );
}
