"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { Gift, Lock, X } from "lucide-react";
import { sound } from "@/components/game/audio/sfx";
import { itemName } from "@/content/wardrobe";
import { islandMeta } from "@/content/meta";
import {
  cheekStyles,
  clothColours,
  eyeStyles,
  hairColours,
  hairStyles,
  isUnlocked,
  itemById,
  items,
  lookOf,
  newIds,
  nextLevelItem,
  skinTones,
  wardrobeLevel,
  type ExtraId,
  type Item,
  type ItemId,
  type Outfit,
  type Slot,
} from "@/lib/game/wardrobe";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { FaceIcon, HairIcon, ItemIcon, NoneIcon } from "./icons";
import { loadWardrobe, markSeen, outfitOf, setOutfit, useWardrobe, useWearRecord } from "./store";
import type { Focus, Spin } from "./wardrobe-scene";

const WardrobeScene = dynamic(() => import("./wardrobe-scene").then((m) => m.WardrobeScene), { ssr: false });

// The wardrobe: the player in a little 3D room on one side, and a panel of
// tabs on the other. Changes save as they're made; nothing here is required.

type Tab = "you" | Slot;
const tabs: { id: Tab; label: string; focus: Focus }[] = [
  { id: "you", label: "You", focus: "head" },
  { id: "hat", label: "Hats", focus: "head" },
  { id: "top", label: "Tops", focus: "body" },
  { id: "bottom", label: "Bottoms", focus: "body" },
  { id: "extra", label: "Extras", focus: "body" },
];

// Hats that take the chosen colour; the island hats come as they are.
const tintedHats = new Set<ItemId>(["beanie", "cap", "sunhat"]);

const eyeNames = { round: "Round", lashes: "Lashes", sleepy: "Sleepy" };
const cheekNames = { blush: "Rosy", freckles: "Freckles", none: "Plain" };
const hairNames = {
  short: "Short",
  buzz: "Buzz cut",
  spiky: "Spiky",
  curly: "Curly",
  bob: "Bob",
  long: "Long",
  ponytail: "Ponytail",
  bun: "Bun",
  spacebuns: "Two buns",
  braid: "Braid",
};

export function Wardrobe({ learnerId, language, onClose }: { learnerId: string; language: TargetLanguageCode; onClose: () => void }) {
  const record = useWardrobe((s) => s.record);
  // What can be worn: everything in developer mode, otherwise what's earned.
  const wearRecord = useWearRecord();
  const ready = useWardrobe((s) => s.ready);
  const outfit = useMemo(() => outfitOf(wearRecord), [wearRecord]);
  const look = useMemo(() => lookOf(outfit), [outfit]);
  const [tab, setTab] = useState<Tab>("you");
  const [hopAt, setHopAt] = useState(0);
  const spin = useRef<Spin>({ yaw: -0.35, velocity: 0, dragging: false, lastInput: 0 });
  const panel = useRef<HTMLDivElement>(null);
  const fresh = useMemo(() => newIds(record), [record]);
  // What was new when this tab opened keeps its badge while you look at it.
  const [badged, setBadged] = useState<ItemId[]>([]);

  useEffect(() => {
    void loadWardrobe(learnerId);
  }, [learnerId]);

  useEffect(() => {
    try {
      const audio = JSON.parse(window.localStorage.getItem("sapling:audio:v2") ?? "{}") as { muted?: boolean };
      sound.setMuted(Boolean(audio.muted));
    } catch {}
    panel.current?.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus();
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);

  const freshIn = (t: Tab) => fresh.filter((id) => itemById(id).slot === t);
  const open = (t: Tab) => {
    sound.play("click");
    setTab(t);
    // What's new keeps its badge while you're on the tab, even once it's seen.
    setBadged((current) => [...new Set([...current, ...freshIn(t)])]);
  };

  // Opening a tab marks its new pieces as seen, after a moment to notice them.
  useEffect(() => {
    if (!ready) return;
    const here = fresh.filter((id) => itemById(id).slot === tab);
    if (!here.length) return;
    const timer = window.setTimeout(() => markSeen(here), 1200);
    return () => window.clearTimeout(timer);
  }, [tab, fresh, ready]);

  const wear = (patch: Partial<Outfit>) => {
    sound.play("pop");
    setOutfit({ ...outfit, ...patch });
    setHopAt(performance.now());
  };

  const level = wardrobeLevel(record);
  const next = nextLevelItem(record);
  const focus = tabs.find((t) => t.id === tab)!.focus;

  return (
    <div className="wardrobe" role="dialog" aria-modal="true" aria-labelledby="wardrobe-title">
      <Stage spinRef={spin}>
        <WardrobeScene look={look} focus={focus} hopAt={hopAt} spinRef={spin} />
      </Stage>

      <div className="wardrobe-panel" ref={panel}>
        <header className="wardrobe-head">
          <div>
            <h2 id="wardrobe-title">Wardrobe</h2>
            <p className="wardrobe-level">
              <strong>Level {level}</strong>
              {next ? (
                <>
                  {" "}
                  · next: <span lang={language}>{itemName(next.id, language).t}</span> at level {next.unlock.level}
                </>
              ) : null}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close wardrobe">
            <X size={20} />
          </button>
        </header>

        <div className="wardrobe-tabs" role="tablist" aria-label="Wardrobe sections">
          {tabs.map((t) => {
            const dot = freshIn(t.id).length > 0;
            return (
              <button
                key={t.id}
                role="tab"
                id={`wardrobe-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="wardrobe-tabpanel"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => open(t.id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  const i = tabs.findIndex((x) => x.id === tab);
                  const nextTab = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                  open(nextTab.id);
                  e.currentTarget.parentElement?.querySelector<HTMLElement>(`#wardrobe-tab-${nextTab.id}`)?.focus();
                }}
              >
                {t.label}
                {dot ? <span className="wardrobe-dot" aria-label="(new)" /> : null}
              </button>
            );
          })}
        </div>

        <div className="wardrobe-body" role="tabpanel" id="wardrobe-tabpanel" aria-labelledby={`wardrobe-tab-${tab}`}>
          {tab === "you" ? (
            <YouTab outfit={outfit} wear={wear} />
          ) : (
            <SlotTab slot={tab} outfit={outfit} wear={wear} language={language} record={wearRecord} badged={badged} />
          )}
        </div>

        <footer className="wardrobe-foot">
          <p>{ready ? "Saved to your account as you go." : "Loading your wardrobe…"}</p>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

// Drag (or use the arrow keys) to turn the player round.
function Stage({ spinRef, children }: { spinRef: RefObject<Spin>; children: React.ReactNode }) {
  const last = useRef<{ x: number; t: number } | null>(null);
  const turn = (by: number) => {
    spinRef.current.yaw += by;
    spinRef.current.lastInput = performance.now();
  };
  return (
    <div
      className="wardrobe-stage"
      tabIndex={0}
      aria-label="Your character. Drag or use the arrow keys to turn them around."
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        spinRef.current.dragging = true;
        spinRef.current.velocity = 0;
        last.current = { x: e.clientX, t: performance.now() };
      }}
      onPointerMove={(e) => {
        if (!spinRef.current.dragging || !last.current) return;
        const now = performance.now();
        const by = (e.clientX - last.current.x) * 0.012;
        turn(by);
        spinRef.current.velocity = by / Math.max(0.016, (now - last.current.t) / 1000);
        last.current = { x: e.clientX, t: now };
      }}
      onPointerUp={() => {
        spinRef.current.dragging = false;
        spinRef.current.lastInput = performance.now();
        last.current = null;
      }}
      onPointerCancel={() => {
        spinRef.current.dragging = false;
        last.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") turn(-0.4);
        if (e.key === "ArrowRight") turn(0.4);
      }}
    >
      {children}
      <p className="wardrobe-hint" aria-hidden="true">
        Drag to turn around
      </p>
    </div>
  );
}

type Wear = (patch: Partial<Outfit>) => void;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="wardrobe-group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Swatches({ colours, value, onPick, label }: { colours: readonly string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <div className="wardrobe-swatches" role="radiogroup" aria-label={label}>
      {colours.map((c, i) => (
        <button
          key={c}
          role="radio"
          aria-checked={value === c}
          aria-label={`${label} ${i + 1}`}
          style={{ background: c }}
          onClick={() => value !== c && onPick(c)}
        />
      ))}
    </div>
  );
}

function YouTab({ outfit, wear }: { outfit: Outfit; wear: Wear }) {
  return (
    <>
      <Group title="Skin">
        <Swatches colours={skinTones} value={outfit.skin} onPick={(skin) => wear({ skin })} label="Skin tone" />
      </Group>
      <Group title="Hair colour">
        <Swatches colours={hairColours} value={outfit.hair} onPick={(hair) => wear({ hair })} label="Hair colour" />
      </Group>
      <Group title="Hairstyle">
        <div className="wardrobe-tiles is-small">
          {hairStyles.map((style) => (
            <Tile key={style} on={outfit.hairStyle === style} onClick={() => wear({ hairStyle: style })} label={hairNames[style]}>
              <HairIcon style={style} hair={outfit.hair} skin={outfit.skin} />
            </Tile>
          ))}
        </div>
      </Group>
      <Group title="Eyes">
        <div className="wardrobe-tiles is-small">
          {eyeStyles.map((eyes) => (
            <Tile key={eyes} on={outfit.eyes === eyes} onClick={() => wear({ eyes })} label={eyeNames[eyes]}>
              <FaceIcon eyes={eyes} cheeks="none" skin={outfit.skin} hair={outfit.hair} />
            </Tile>
          ))}
        </div>
      </Group>
      <Group title="Cheeks">
        <div className="wardrobe-tiles is-small">
          {cheekStyles.map((cheeks) => (
            <Tile key={cheeks} on={outfit.cheeks === cheeks} onClick={() => wear({ cheeks })} label={cheekNames[cheeks]}>
              <FaceIcon eyes={outfit.eyes} cheeks={cheeks} skin={outfit.skin} hair={outfit.hair} />
            </Tile>
          ))}
        </div>
      </Group>
      <Group title="Beard">
        <div className="wardrobe-tiles is-small">
          {[false, true].map((beard) => (
            <Tile key={String(beard)} on={outfit.beard === beard} onClick={() => wear({ beard })} label={beard ? "Beard" : "None"}>
              <FaceIcon eyes={outfit.eyes} cheeks={outfit.cheeks} beard={beard} skin={outfit.skin} hair={outfit.hair} />
            </Tile>
          ))}
        </div>
      </Group>
    </>
  );
}

function SlotTab({
  slot,
  outfit,
  wear,
  language,
  record,
  badged,
}: {
  slot: Slot;
  outfit: Outfit;
  wear: Wear;
  language: TargetLanguageCode;
  record: Parameters<typeof isUnlocked>[1];
  badged: ItemId[];
}) {
  const here = items.filter((item) => item.slot === slot);
  const colourKey = ({ hat: "hatColour", top: "topColour", bottom: "bottomColour", extra: "extraColour" } as const)[slot];
  const colour = outfit[colourKey];
  const worn = (id: ItemId) =>
    slot === "hat" ? outfit.hat === id : slot === "top" ? outfit.top === id : slot === "bottom" ? outfit.bottom === id : outfit.extras.includes(id as ExtraId);
  const put = (id: ItemId) => {
    if (slot === "hat") wear({ hat: id as Outfit["hat"] });
    else if (slot === "top") wear({ top: id as Outfit["top"] });
    else if (slot === "bottom") wear({ bottom: id as Outfit["bottom"] });
    else wear({ extras: worn(id) ? outfit.extras.filter((e) => e !== id) : [...outfit.extras, id as ExtraId] });
  };
  const showColour = slot === "hat" ? Boolean(outfit.hat && tintedHats.has(outfit.hat)) : slot === "extra" ? outfit.extras.includes("scarf") : true;
  return (
    <>
      <div className="wardrobe-tiles">
        {slot === "hat" ? (
          <Tile on={outfit.hat === null} onClick={() => wear({ hat: null })} label="No hat">
            <NoneIcon />
          </Tile>
        ) : null}
        {here.map((item) => {
          const open = isUnlocked(item, record);
          const name = itemName(item.id, language);
          return (
            <Tile
              key={item.id}
              on={open && worn(item.id)}
              locked={!open}
              isNew={badged.includes(item.id)}
              onClick={() => open && put(item.id)}
              label={name.t}
              lang={language}
              sub={open ? name.en : <LockNote item={item} />}
            >
              <ItemIcon id={item.id} colour={tintedHats.has(item.id) || slot !== "hat" ? colour : "#c0392b"} locked={!open} />
            </Tile>
          );
        })}
      </div>
      {showColour ? (
        <Group title={slot === "extra" ? "Scarf colour" : "Colour"}>
          <Swatches colours={clothColours} value={colour} onPick={(c) => wear({ [colourKey]: c })} label="Colour" />
        </Group>
      ) : null}
      {slot === "extra" ? <p className="wardrobe-note">Wear as many extras as you like.</p> : null}
    </>
  );
}

function LockNote({ item }: { item: Item }) {
  if (item.unlock.kind === "level")
    return (
      <span className="wardrobe-lock">
        <Lock size={12} aria-hidden="true" /> Level {item.unlock.level}
      </span>
    );
  if (item.unlock.kind === "gift") {
    const island = islandMeta.find((m) => m.code === (item.unlock as { island: TargetLanguageCode }).island)?.island;
    return (
      <span className="wardrobe-lock">
        <Gift size={12} aria-hidden="true" /> From {item.unlock.from}, {island}
      </span>
    );
  }
  return null;
}

function Tile({
  on,
  locked = false,
  isNew = false,
  onClick,
  label,
  sub,
  lang,
  children,
}: {
  on: boolean;
  locked?: boolean;
  isNew?: boolean;
  onClick: () => void;
  label: string;
  sub?: React.ReactNode;
  lang?: string;
  children: React.ReactNode;
}) {
  return (
    <button className={`wardrobe-tile${locked ? " is-locked" : ""}`} aria-pressed={on} aria-disabled={locked || undefined} onClick={onClick}>
      {isNew ? <span className="wardrobe-new">New</span> : null}
      <span className="wardrobe-tile-icon">{children}</span>
      <span className="wardrobe-tile-name" lang={lang}>
        {label}
      </span>
      {sub ? <span className="wardrobe-tile-sub">{sub}</span> : null}
    </button>
  );
}
