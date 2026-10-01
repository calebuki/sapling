"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChefHat, Coins, Ear, Trash2, Users, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { cafeItem } from "@/lib/game/cafe";
import { conceptStrength } from "@/lib/game/progression";
import { RUSH_LEVELS, starsFor } from "@/lib/game/rush";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { speak } from "../audio/speech";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { CafeIconArt } from "../ui/cafe-round";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { guestHead, HOST_HEAD } from "./cafe-room";
import { useShiftAnchor } from "./anchors";
import { JobBar, JobIntro, JobLabel, JobSummary, useWordLabel } from "./job-ui";
import { stationSlugs, stationX, STATION_Z } from "./cafe-layout";
import {
  askKitchen,
  beginRush,
  closeKitchen,
  dropFromTray,
  emptyTray,
  kitchenNeeds,
  leaveShift,
  pardon,
  sayOrder,
  shiftRuntime,
  shiftSetup,
  startShift,
  TRAY_LIMIT,
  useShift,
  type Customer,
  type ShiftSetup,
} from "./cafe-store";

// ---------- Starting a shift ----------

// Whether this host can use a hand yet, and how to start. A shift only orders
// menu items the learner has met, so it needs a couple of them first.
export function useShiftStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const cafe = pack.cafe;
    const rush = cafe?.rush;
    if (villager.round !== "cafe" || !cafe || !rush) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const items = cafe.menu.map((m) => m.slug).filter(met);
    const ready = items.length >= 2;
    const setup: ShiftSetup = {
      code: pack.code,
      host: villager,
      cafe,
      rush,
      items,
      quantities: met(rush.quantity.concept),
      modifiers: met(rush.modifier.concept),
      // Weak words come up more often than ones you already know well.
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    return { ready, level: save?.level ?? 0, start: (level = save?.level ?? 0) => startShift(setup, level), invite: rush.lines.invite, notYet: rush.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function ShiftUI() {
  const setup = shiftSetup();
  const status = useShift((s) => s.status);
  const kitchenOpen = useShift((s) => s.kitchen.open);
  if (!setup) return null;
  return (
    <div className="shift">
      <ShiftTop setup={setup} />
      {status === "leaving" ? null : (
        <>
          <Labels setup={setup} />
          <Bubbles />
        </>
      )}
      {status === "running" ? <TrayBar setup={setup} /> : null}
      {status === "running" && kitchenOpen ? <KitchenHatch setup={setup} /> : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function ShiftTop({ setup }: { setup: ShiftSetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useShiftStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, level, served, lost, tips, coming, customers } = useShift((s) => s);
  const { lines } = setup.rush;
  const left = coming + customers.filter((c) => c.status === "entering" || c.status === "waiting").length;
  return (
    <JobBar icon={<ChefHat size={22} />} title={lines.title} levelIndex={levelIndex} levels={RUSH_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveShift}>
      <span title={lines.guests.en}>
        <Users size={18} /> <GlossedLine line={lines.guests} /> <strong>{served}</strong>
        <span className="shift-of">/ {level.guests}</span>
        {lost ? <span className="shift-lost">−{lost}</span> : null}
      </span>
      <span title={lines.tips.en}>
        <Coins size={18} /> <GlossedLine line={lines.tips} /> <strong>{tips}</strong>
      </span>
      <span className="shift-coming" aria-hidden="true">
        {Array.from({ length: Math.max(0, left) }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </JobBar>
  );
}

// Station names float over the stations while the room is new.
function Labels({ setup }: { setup: ShiftSetup }) {
  const labels = useShift((s) => s.level.labels);
  const slugs = stationSlugs(setup.cafe, setup.rush);
  return (
    <>
      {labels
        ? slugs.map((slug) => {
            const item = cafeItem(setup.cafe, slug)!;
            return <JobLabel key={slug} id={`station:${slug}`} at={[stationX(slugs, slug), 2.35, STATION_Z]} text={item.name} en={item.en} />;
          })
        : null}
      <HostTag setup={setup} />
    </>
  );
}

function HostTag({ setup }: { setup: ShiftSetup }) {
  const where = useCallback(() => HOST_HEAD, []);
  const ref = useShiftAnchor("host", where);
  const reply = useShift((s) => s.kitchen.reply);
  return (
    <div ref={ref} className="world-anchor">
      <div className="villager-tag">
        {reply ? (
          <div key={reply.t} className="villager-bubble">
            <Glossed text={reply.t} en={reply.en} />
          </div>
        ) : null}
        <span className="villager-name">{setup.host.name}</span>
      </div>
    </div>
  );
}

function Bubbles() {
  const customers = useShift((s) => s.customers);
  return (
    <>
      {customers.map((c) => (
        <Bubble key={c.id} customer={c} />
      ))}
    </>
  );
}

function Bubble({ customer }: { customer: Customer }) {
  const { ui } = useIsland();
  const repeat = shiftSetup()!.rush.lines.repeat;
  const where = useCallback(() => guestHead(customer.id), [customer.id]);
  const left = useCallback(() => {
    const guest = shiftRuntime.guests.get(customer.id);
    return guest ? Math.max(0, 1 - guest.waited / guest.patience) : null;
  }, [customer.id]);
  const ref = useShiftAnchor(`guest:${customer.id}`, where, left, "side");
  const { status, said, revealed, order } = customer;
  if (status === "entering") return <div ref={ref} className="world-anchor" />;
  const leaving = status === "happy" || status === "angry";
  return (
    <div ref={ref} className="world-anchor">
      <div className={`shift-bubble is-${status}`}>
        {said ? (
          <p className="shift-said">
            <Glossed text={said.t} en={said.en} />
          </p>
        ) : null}
        {!leaving ? (
          <>
            {revealed ? (
              <p className={said ? "shift-order is-small" : "shift-order"}>
                <Glossed text={order.line.t} en={order.line.en} />
              </p>
            ) : (
              <p className="shift-order is-heard">
                <Ear size={18} /> …
              </p>
            )}
            <div className="shift-bubble-tools">
              <button className="icon-button" aria-label={aria(ui.listenAgain)} onClick={() => sayOrder(customer, false)}>
                <Volume2 size={16} />
              </button>
              <button className="shift-pardon" onClick={() => pardon(customer)}>
                <GlossedLine line={repeat} />
              </button>
            </div>
            <div className="shift-patience" aria-hidden="true">
              <i />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TrayBar({ setup }: { setup: ShiftSetup }) {
  const { ui } = useIsland();
  const tray = useShift((s) => s.tray);
  const levelIndex = useShift((s) => s.levelIndex);
  const [showHow, setShowHow] = useState(levelIndex === 0);
  useEffect(() => {
    if (!showHow) return;
    const timer = window.setTimeout(() => setShowHow(false), 14000);
    return () => window.clearTimeout(timer);
  }, [showHow]);
  return (
    <>
      <div className="shift-tray" aria-label={aria(ui.yourTray)}>
        <GlossedLine line={ui.yourTray} className="cafe-board-title" />
        <div className="shift-tray-items">
          {Array.from({ length: TRAY_LIMIT }, (_, i) => {
            const item = tray[i] ? cafeItem(setup.cafe, tray[i]) : null;
            return item ? (
              <button key={`${item.slug}-${i}`} className="shift-tray-slot is-full" title={item.name} onClick={() => dropFromTray(i)}>
                <CafeIconArt icon={item.icon} />
              </button>
            ) : (
              <span key={`empty-${i}`} className="shift-tray-slot" />
            );
          })}
        </div>
        <button className="btn btn-quiet shift-trash" disabled={!tray.length} onClick={emptyTray}>
          <Trash2 size={17} /> <GlossedLine line={setup.rush.lines.trash} />
        </button>
      </div>
      {showHow ? (
        <p className="shift-how">
          <GlossedLine line={setup.rush.lines.howTo} />
        </p>
      ) : null}
    </>
  );
}

function KitchenHatch({ setup }: { setup: ShiftSetup }) {
  const { rush, host } = setup;
  const reply = useShift((s) => s.kitchen.reply);
  const needs = useMemo(() => kitchenNeeds(), []);
  const hint = needs.length ? needs.map((p) => rush.phrase(p).t).join(` ${rush.and.t} `) : rush.phrase({ item: rush.kitchen[0], count: 1 }).t;
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeKitchen();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const line = reply ?? rush.lines.kitchenAsk;
  return (
    <div className="dialogue shift-hatch" role="dialog" aria-label={host.name}>
      <div className="dialogue-plate">
        <span className="dialogue-name" style={{ background: host.look.accent }}>
          {host.name}
        </span>
        <button className="dialogue-close" aria-label={aria(rush.lines.back)} onClick={closeKitchen}>
          ×
        </button>
      </div>
      <div className="dialogue-body">
        <p className="shift-hatch-line">
          <Glossed text={line.t} en={line.en} />
          <button className="icon-button" aria-label={aria(rush.lines.repeat)} onClick={() => void speak(line.t, { who: host.id, pitch: host.voicePitch })}>
            <Volume2 size={16} />
          </button>
        </p>
        <FreeAnswer
          key={round}
          busy={busy}
          hint={hint}
          onSubmit={async (answer, via, hinted) => {
            setBusy(true);
            await askKitchen(answer, via, hinted);
            setBusy(false);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

function Intro({ setup }: { setup: ShiftSetup }) {
  const { host, rush } = setup;
  const levelIndex = useShift((s) => s.levelIndex);
  // Returning helpers skip straight to the last line.
  const [firstTime] = useState(() => !(getGame().save.shifts[host.id]?.stars.length ?? 0));
  const lines = firstTime ? rush.lines.intro : [rush.lines.intro[rush.lines.intro.length - 1]];
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={RUSH_LEVELS.length} onDone={beginRush} />;
}

function Summary({ setup }: { setup: ShiftSetup }) {
  const { served, level, tips, words, levelUp, levelIndex } = useShift((s) => s);
  const starter = useShiftStarter(setup.host);
  const label = useWordLabel((slug) => {
    const item = cafeItem(setup.cafe, slug);
    return item ? { t: item.name, en: item.en } : null;
  });
  const stars = starsFor(served, level.guests);
  const { lines } = setup.rush;
  return (
    <JobSummary
      title={lines.title}
      stars={stars}
      line={lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <>
          <span>
            <Users size={18} /> {served} / {level.guests}
          </span>
          <span>
            <Coins size={18} /> {tips}
          </span>
        </>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveShift}
    />
  );
}
