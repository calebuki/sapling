"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, NotebookPen, PanelRightClose, X } from "lucide-react";
import { aria } from "@/lib/game/ui-text";
import { useIsland } from "../island";
import { Glossed, GlossedLine } from "./glossed";

// A lesson spreads over the screen instead of stacking in one card: progress
// sits at the top, the task stays at the bottom, and everything that is nice
// to know but not needed to answer lives in a drawer on the right.

function gameRoot() {
  return typeof document === "undefined" ? null : document.querySelector(".game-root");
}

export function LessonTopBar({ length, done }: { length: number; done: number }) {
  const root = gameRoot();
  if (!root) return null;
  return createPortal(
    <div className="lesson-topbar" aria-hidden="true">
      {Array.from({ length }, (_, i) => (
        <span key={i} className={i < done ? "is-done" : i === done ? "is-current" : ""} />
      ))}
    </div>,
    root,
  );
}

const DRAWER_KEY = "sapling:lesson-drawer";
const WIDE = "(min-width: 1100px)";

// On wide screens the drawer remembers whether the learner closed it.
function readDrawerChoice() {
  try {
    const saved = window.localStorage.getItem(DRAWER_KEY);
    return saved ? saved === "open" : null;
  } catch {
    return null;
  }
}

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function LessonSide({ children }: { children: React.ReactNode }) {
  const { ui } = useIsland();
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);
  const [choice, setChoice] = useState(readDrawerChoice);
  // On a narrow screen the drawer covers the lesson, so it only peeks when asked.
  const [peek, setPeek] = useState(false);
  const open = wide ? (choice ?? true) : peek;
  const root = gameRoot();
  if (!root) return null;
  const toggle = () => {
    if (!wide) return setPeek(!peek);
    setChoice(!open);
    try {
      window.localStorage.setItem(DRAWER_KEY, open ? "closed" : "open");
    } catch {
      // The drawer still toggles for this visit.
    }
  };
  return createPortal(
    <aside className={`lesson-side ${open ? "is-open" : ""}`} aria-label={aria(ui.notes)}>
      <button className="lesson-side-toggle" onClick={toggle} aria-expanded={open} aria-label={aria(ui.notes)}>
        {open ? <PanelRightClose size={18} /> : <NotebookPen size={18} />}
        {open ? null : <GlossedLine line={ui.notes} />}
      </button>
      {open ? <div className="lesson-side-body">{children}</div> : null}
    </aside>,
    root,
  );
}

export type LogEntry = { who: string; cue: string; you: string; ok: boolean };

// The exchanges so far this round, so the task card only shows the current one.
export function ConversationLog({ entries }: { entries: LogEntry[] }) {
  const { ui } = useIsland();
  return (
    <section className="lesson-log">
      <GlossedLine line={ui.conversation} className="lesson-side-title" />
      {entries.length === 0 ? <span className="scene-empty">…</span> : null}
      <ol>
        {entries.map((entry, i) => (
          <li key={i}>
            <p>
              <strong>{entry.who}:</strong> <Glossed text={entry.cue} />
            </p>
            <p className={`lesson-log-you ${entry.ok ? "is-ok" : "is-miss"}`}>
              {entry.ok ? <Check size={14} /> : <X size={14} />} <Glossed text={entry.you} />
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
