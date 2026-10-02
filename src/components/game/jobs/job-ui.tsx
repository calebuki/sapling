"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlarmClock, ArrowRight, ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { ItemIcon } from "@/components/wardrobe/icons";
import { itemName, wardrobeNews } from "@/content/wardrobe";
import { lessonOpensFor } from "@/lib/game/job-lesson";
import type { Line } from "@/lib/game/line";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import type { ItemId } from "@/lib/game/wardrobe";
import { sound } from "../audio/sfx";
import { speak } from "../audio/speech";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { useShiftAnchor } from "./anchors";
import { JobLessonButton, JobLessonModal } from "./job-lesson";

// The screens every job shares: the bar along the top, names floating over
// the room, the host's opening words and the end-of-shift card.

export function JobBar({
  icon,
  title,
  levelIndex,
  levels,
  children,
  onPick,
  onClose,
}: {
  icon: ReactNode;
  title: Line;
  levelIndex: number;
  levels: number;
  children: ReactNode;
  // Developer mode: jump straight to a rung.
  onPick?: (level: number) => void;
  onClose: () => void;
}) {
  const { ui } = useIsland();
  return (
    <div className="shift-top">
      <div className="shift-title">
        {icon}
        <GlossedLine line={title} />
        <span className="shift-pips" aria-label={`${levelIndex + 1} / ${levels}`}>
          {Array.from({ length: levels }, (_, i) =>
            onPick ? (
              <button key={i} className={`shift-pip ${i <= levelIndex ? "is-on" : ""}`} aria-label={`${i + 1}`} onClick={() => onPick(i)} />
            ) : (
              <i key={i} className={i <= levelIndex ? "is-on" : ""} />
            ),
          )}
        </span>
      </div>
      <div className="shift-score">{children}</div>
      <button className="hud-button" aria-label={aria(ui.close)} onClick={onClose}>
        <X size={20} />
      </button>
    </div>
  );
}

// A clock that runs down outside React; `left` is 0..1.
export function JobClock({ label, left }: { label: Line; left: () => number }) {
  const bar = useRef<HTMLSpanElement>(null);
  const read = useRef(left);
  useEffect(() => {
    read.current = left;
  });
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const value = read.current();
      if (bar.current) {
        bar.current.style.width = `${(value * 100).toFixed(1)}%`;
        bar.current.dataset.low = value < 0.25 ? "1" : "";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <span className="home-clock" title={label.en}>
      <AlarmClock size={18} /> <GlossedLine line={label} />
      <span className="home-clock-track">
        <span ref={bar} className="home-clock-fill" />
      </span>
    </span>
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

// The answer box along the bottom. It slides down out of the way (leaving its
// tab) so you can see what it covers in the room, and back up to answer.
export function JobPanel({ host, label, children }: { host?: Villager; label: Line; children: ReactNode }) {
  const { ui } = useIsland();
  const [open, setOpen] = useState(true);
  const toggle = () => {
    sound.play("pop");
    setOpen(!open);
  };
  return (
    <div className={`job-panel ${open ? "is-open" : "is-closed"}`} role="dialog" aria-label={host?.name ?? label.en}>
      <button className="job-panel-tab" aria-expanded={open} aria-label={aria(open ? ui.hide : ui.show)} onClick={toggle}>
        {host ? (
          <span className="job-panel-name" style={{ background: host.look.accent }}>
            {host.name}
          </span>
        ) : null}
        <span className="job-panel-label">
          <GlossedLine line={label} />
        </span>
        {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
      <div className="dialogue-body job-panel-body" inert={!open}>
        {children}
      </div>
    </div>
  );
}

// The host explains, one line at a time; returning helpers only hear the last.
// The job's little lesson comes first the first time you help, and the first
// time at a level that brings something new; it can be opened again from here.
export function JobIntro({ host, lines, levelIndex, levels, onDone }: { host: Villager; lines: Line[]; levelIndex: number; levels: number; onDone: () => void }) {
  const { jobLessons } = useIsland();
  const job = useGame((s) => s.job);
  const lesson = job ? jobLessons?.jobs[job] : undefined;
  const [lessonOpen, setLessonOpen] = useState<"all" | "new" | null>(() => lessonOpensFor(lesson, levelIndex, getGame().save.shifts[host.id]?.stars));
  const [index, setIndex] = useState(0);
  if (lesson && lessonOpen) {
    return <JobLessonModal host={host} lesson={lesson} levelIndex={levelIndex} onlyNew={lessonOpen === "new"} onDone={() => setLessonOpen(null)} />;
  }
  return <IntroLines host={host} lines={lines} index={index} setIndex={setIndex} levelIndex={levelIndex} levels={levels} onDone={onDone} onLesson={lesson ? () => setLessonOpen("all") : null} />;
}

function IntroLines({
  host,
  lines,
  index,
  setIndex,
  levelIndex,
  levels,
  onDone,
  onLesson,
}: {
  host: Villager;
  lines: Line[];
  index: number;
  setIndex: (index: number) => void;
  levelIndex: number;
  levels: number;
  onDone: () => void;
  onLesson: (() => void) | null;
}) {
  const { ui } = useIsland();
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
          {onLesson ? <JobLessonButton onOpen={onLesson} /> : null}
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
  gift = null,
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
  // Work clothes the host has just given you.
  gift?: ItemId | null;
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
      {gift ? <JobGift id={gift} /> : null}
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

// "This is for you!": the host's work clothes, now in your wardrobe.
function JobGift({ id }: { id: ItemId }) {
  const { code } = useIsland();
  const name = itemName(id, code);
  const forYou = wardrobeNews[code].forYou ?? wardrobeNews[code].newItem;
  useEffect(() => {
    sound.play("sparkle");
  }, []);
  return (
    <div className="shift-gift">
      <span className="shift-gift-icon">
        <ItemIcon id={id} colour="#c0392b" />
      </span>
      <span>
        <GlossedLine line={forYou} />
        <strong>
          <Glossed text={name.t} en={name.en} />
        </strong>
        <small>{wardrobeNews[code].newItem.en}</small>
      </span>
    </div>
  );
}
