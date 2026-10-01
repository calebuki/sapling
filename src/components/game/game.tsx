"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { loadWardrobe, recordProgress, useWardrobe } from "@/components/wardrobe/store";
import { loadIsland } from "@/content/islands";
import { itemName, wardrobeNews } from "@/content/wardrobe";
import type { IslandPack } from "@/content/types";
import { openThrough } from "@/lib/game/placement";
import { computeProgress } from "@/lib/game/progression";
import type { VillagerId } from "@/lib/game/villagers";
import { giftsFor, giverOf } from "@/lib/game/wardrobe";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "./audio/sfx";
import { island, IslandContext, setIsland, useIsland, villagerById } from "./island";
import { getGame, loadSave, runtime, setGame, toast, useGame } from "./store";
import { Dialogue } from "./ui/dialogue";
import { registerGloss, TooltipLayer } from "./ui/glossed";
import { Hud, Toasts } from "./ui/hud";
import { Onboarding } from "./ui/onboarding";
import { Overlays } from "./ui/overlays";
import { TitleScreen } from "./ui/title-screen";
import { useKeyboard } from "./world/actors";
import { Scene } from "./world/scene";
import { WorldLabels } from "./world-labels";

// Rendered client-only, so the device can be inspected up front.
function useQuality() {
  const [quality] = useState<"high" | "low">(() =>
    window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high",
  );
  return quality;
}

function beginPlay() {
  const { spawn } = island().world;
  sound.ensure();
  sound.setMuted(getGame().muted);
  sound.play("whoosh");
  sound.startAmbience();
  runtime.player.x = spawn.x;
  runtime.player.z = spawn.z;
  runtime.cameraYaw = 0;
  runtime.cameraYawTarget = 0;
  setGame({ phase: "arrival" });
  window.setTimeout(() => setGame({ phase: "explore" }), 2600);
}

// Loads the island for this language, then hands it to the game.
export function Game({ code }: { code: TargetLanguageCode }) {
  const [pack, setPack] = useState<IslandPack | null>(null);
  useEffect(() => {
    let active = true;
    void loadIsland(code).then((loaded) => {
      if (!active || !loaded) return;
      setIsland(loaded);
      setPack(loaded);
    });
    return () => {
      active = false;
    };
  }, [code]);
  if (pack?.code !== code) return <div className="game-boot" role="status" />;
  return (
    <IslandContext.Provider value={pack}>
      <IslandGame key={code} />
    </IslandContext.Provider>
  );
}

function IslandGame() {
  const model = useLearningModel();
  const quality = useQuality();
  const { code, course, villagers, placement, ui, host } = useIsland();
  const phase = useGame((s) => s.phase);
  const talkingTo = useGame((s) => s.talkingTo);
  const discovered = useGame((s) => s.save.discovered);
  const name = useGame((s) => s.save.name);
  const introDone = useGame((s) => s.save.introDone);
  const placed = useGame((s) => s.save.placedBand);
  const loaded = useGame((s) => s.loadedFor === `${model.learnerId}:${code}`);
  const [liveAvailable, setLiveAvailable] = useState(false);
  useKeyboard();

  useEffect(() => {
    loadSave(model.learnerId, code);
    void loadWardrobe(model.learnerId);
  }, [model.learnerId, code]);

  useEffect(() => {
    if (name) registerGloss(name, "(your name)");
  }, [name]);

  useEffect(() => {
    if (model.mode !== "supabase") return;
    let active = true;
    fetch("/api/voice/session")
      .then((r) => r.json())
      .then((r) => active && setLiveAvailable(Boolean(r.available)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [model.mode]);

  const progress = useMemo(
    () =>
      computeProgress({
        course,
        villagers,
        concepts: model.concepts,
        states: model.states,
        discoveredCount: discovered.length,
        openThrough: openThrough(placement, course.units, placed),
        startUnit: placement.bands[placed] ?? 0,
      }),
    [course, villagers, placement, model.concepts, model.states, discovered.length, placed],
  );

  const ready = loaded && !model.isLoading && model.targetLanguage.code === code;

  // Celebrate new levels and newly unlocked villagers, but not on first load.
  const seen = useRef<{ level: number; unlocked: Set<VillagerId> } | null>(null);
  useEffect(() => {
    if (!ready) return;
    const unlocked = new Set(villagers.filter((v) => progress.villagers[v.id].unlocked).map((v) => v.id));
    const previous = seen.current;
    seen.current = { level: progress.level, unlocked };
    if (!previous) return;
    if (progress.level > previous.level) {
      sound.play("levelup");
      setGame((s) => ({ celebration: s.celebration + 1 }));
      toast("level", { t: `${ui.levelUp.t} ${ui.level.t} ${progress.level}`, en: `${ui.levelUp.en} Level ${progress.level}` }, ui.treeGrows, 5200);
    }
    for (const id of unlocked) {
      if (!previous.unlocked.has(id)) {
        const villager = villagerById(id);
        window.setTimeout(() => {
          sound.play("sparkle");
          toast("friend", ui.newFriend(villager.name), villager.place, 5200);
        }, 1400);
      }
    }
  }, [progress, ready, villagers, ui]);

  // The wardrobe remembers the best level reached here and any gifts given,
  // and says so when that brings something new to wear. It waits for the
  // title screen to go, so the news lands in the world.
  const wardrobeReady = useWardrobe((s) => s.ready);
  const playing = phase !== "title";
  useEffect(() => {
    if (!ready || !wardrobeReady || !playing) return;
    const done = progress.units.filter((u) => u.ready).map((u) => u.unit.id);
    const fresh = recordProgress(code, progress.level, giftsFor(code, done));
    if (!fresh.length) return;
    const news = wardrobeNews[code];
    const giver = giverOf(fresh[0]);
    // After any level-up toast, so the two don't land at once.
    window.setTimeout(() => {
      sound.play("sparkle");
      if (fresh.length > 1) toast("gift", news.newItems(fresh.length), undefined, 5200);
      else toast("gift", giver ? news.giftFrom(giver) : news.newItem, itemName(fresh[0], code), 5200);
    }, 2200);
  }, [progress, ready, wardrobeReady, playing, code]);

  const unlocked = useMemo(
    () => Object.fromEntries(villagers.map((v) => [v.id, progress.villagers[v.id].unlocked])) as Record<VillagerId, boolean>,
    [progress, villagers],
  );

  return (
    <div className={`game-root island-${code} phase-${phase}`}>
      <Scene
        treeStage={phase === "title" ? Math.max(2, progress.treeStage) : progress.treeStage}
        goal={phase === "title" ? null : introDone ? progress.goal : host}
        unlocked={unlocked}
        quality={quality}
      />
      <WorldLabels unlocked={unlocked} />
      <Hud progress={progress} />
      {phase === "dialogue" && talkingTo ? <Dialogue key={talkingTo} id={talkingTo} progress={progress} liveAvailable={liveAvailable} /> : null}
      <Toasts />
      {ready ? <Onboarding /> : null}
      <Overlays progress={progress} />
      <TitleScreen ready={ready} onPlay={beginPlay} />
      {model.error ? (
        <p className="game-error" role="alert">
          {model.error}
        </p>
      ) : null}
      <TooltipLayer />
    </div>
  );
}
