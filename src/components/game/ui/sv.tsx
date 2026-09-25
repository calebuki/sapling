"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ElementType } from "react";
import { createPortal } from "react-dom";
import { lookupGloss, normalizeWord } from "@/lib/game/glossary";
import type { Line } from "@/lib/game/villagers";

// A single tooltip layer shared by every <Sv>, including ones rendered inside
// the 3D scene's HTML labels (which live in separate React roots).

type Tip = { rect: DOMRect; target: HTMLElement; word: string; gloss: string | null; phrase: string | null; loading: boolean } | null;
let tip: Tip = null;
const tipListeners = new Set<() => void>();
function setTip(next: Tip) {
  tip = next;
  tipListeners.forEach((l) => l());
}

const extraGlosses = new Map<string, string>();
export function registerGloss(word: string, english: string) {
  extraGlosses.set(normalizeWord(word), english);
}

const remote = new Map<string, Promise<string | null>>();
function fetchGloss(word: string, context: string) {
  const key = normalizeWord(word);
  let request = remote.get(key);
  if (!request) {
    request = fetch("/api/gloss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, context: context.slice(0, 300) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((r: { gloss?: string } | null) => r?.gloss ?? null)
      .catch(() => null);
    remote.set(key, request);
  }
  return request;
}

export function glossFor(word: string) {
  return extraGlosses.get(normalizeWord(word)) ?? lookupGloss(word) ?? null;
}

let hideTimer: number | undefined;

function show(target: HTMLElement, word: string, phrase: string | undefined, context: string) {
  window.clearTimeout(hideTimer);
  const gloss = glossFor(word);
  const rect = target.getBoundingClientRect();
  setTip({ rect, target, word, gloss, phrase: phrase ?? null, loading: !gloss });
  if (!gloss) {
    void fetchGloss(word, context).then((remoteGloss) => {
      if (tip && tip.word === word) setTip({ ...tip, gloss: remoteGloss, loading: false });
    });
  }
}

function hide(event?: { pointerType?: string }) {
  window.clearTimeout(hideTimer);
  // Touch has no hover: keep the translation up long enough to read.
  hideTimer = window.setTimeout(() => setTip(null), event?.pointerType === "touch" ? 2200 : 60);
}

const WORD = /(\p{L}[\p{L}\p{N}]*)/u;

export function Sv({
  text,
  en,
  as,
  className,
}: {
  text: string;
  en?: string;
  as?: ElementType;
  className?: string;
}) {
  const parts = text.split(WORD);
  const Tag = (as ?? "span") as "span";
  return (
    <Tag className={`sv ${className ?? ""}`} lang="sv">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span
            key={index}
            className="sv-w"
            onPointerEnter={(e) => show(e.currentTarget, part, en, text)}
            onPointerLeave={(e) => hide(e)}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </Tag>
  );
}

export function SvLine({ line, as, className }: { line: Line; as?: ElementType; className?: string }) {
  return <Sv text={line.sv} en={line.en} as={as} className={className} />;
}

export function TooltipLayer() {
  const current = useSyncExternalStore(
    (l) => {
      tipListeners.add(l);
      return () => tipListeners.delete(l);
    },
    () => tip,
    () => null,
  );
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number; above: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!current || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const margin = 10;
    let left = current.rect.left + current.rect.width / 2 - box.width / 2;
    left = Math.max(margin, Math.min(window.innerWidth - box.width - margin, left));
    const below = current.rect.bottom + 8;
    const above = below + box.height > window.innerHeight - margin;
    setPlacement({ left, top: above ? current.rect.top - box.height - 8 : below, above });
  }, [current]);

  useEffect(() => {
    const clear = () => setTip(null);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("wheel", clear, { passive: true });
    // Words can disappear under the pointer (a dialogue closes); drop their tooltip.
    const orphan = window.setInterval(() => {
      if (tip && !tip.target.isConnected) setTip(null);
    }, 250);
    return () => {
      window.clearInterval(orphan);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("wheel", clear);
    };
  }, []);

  if (!current) return null;
  const showPhrase = current.phrase && current.phrase.toLowerCase() !== (current.gloss ?? "").toLowerCase();
  // Portaled so it stacks above body-level dialogs (grammar tips, onboarding)
  // instead of being trapped in the game root's stacking context.
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className={`sv-tip ${placement?.above ? "is-above" : ""}`}
      style={{ left: placement?.left ?? -9999, top: placement?.top ?? -9999 }}
    >
      {current.gloss ? (
        <strong>{current.gloss}</strong>
      ) : current.loading ? (
        <strong className="sv-tip-loading">…</strong>
      ) : null}
      {showPhrase ? <span>{current.phrase}</span> : null}
    </div>,
    document.body,
  );
}
