"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { computeProgress } from "@/lib/game/progression";
import { ui } from "@/lib/game/ui-text";
import { villagers, type VillagerId } from "@/lib/game/villagers";
import { sound } from "./audio/sfx";
import { getGame, loadSave, runtime, setGame, toast, useGame } from "./store";
import { Dialogue } from "./ui/dialogue";
import { Hud, Toasts } from "./ui/hud";
import { Overlays } from "./ui/overlays";
import { registerGloss, TooltipLayer } from "./ui/sv";
import { TitleScreen } from "./ui/title-screen";
import { useKeyboard } from "./world/actors";
import { Scene } from "./world/scene";
import { WorldLabels } from "./world-labels";
import { spawn } from "@/lib/game/world";

// Rendered client-only, so the device can be inspected up front.
function useQuality() {
  const [quality] = useState<"high" | "low">(() =>
    window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high",
  );
  return quality;
}

function beginPlay() {
  sound.ensure();
  sound.setMuted(getGame().muted);
  sound.setMusic(getGame().music);
  sound.play("whoosh");
  sound.startAmbience();
  sound.startMusic();
  runtime.player.x = spawn.x;
  runtime.player.z = spawn.z;
  runtime.cameraYaw = 0;
  setGame({ phase: "arrival" });
  window.setTimeout(() => setGame({ phase: "explore" }), 2600);
}

// Signed-out visitors see the living island behind the title and a sign-in door.
export function GameTitleOnly() {
  const quality = useQuality();
  return (
    <div className="game-root">
      <Scene treeStage={3} goal={null} unlocked={allUnlocked} quality={quality} />
      <WorldLabels unlocked={allUnlocked} />
      <TitleScreen ready needsSignIn onPlay={() => undefined} />
      <TooltipLayer />
    </div>
  );
}

const allUnlocked = { elin: true, bosse: true, stina: true, astrid: true } as Record<VillagerId, boolean>;

export function Game() {
  const model = useLearningModel();
  const quality = useQuality();
  const phase = useGame((s) => s.phase);
  const talkingTo = useGame((s) => s.talkingTo);
  const discovered = useGame((s) => s.save.discovered);
  const name = useGame((s) => s.save.name);
  const introDone = useGame((s) => s.save.introDone);
  const loaded = useGame((s) => s.loadedFor === model.learnerId);
  const [liveAvailable, setLiveAvailable] = useState(false);
  useKeyboard();

  useEffect(() => {
    loadSave(model.learnerId);
  }, [model.learnerId]);

  useEffect(() => {
    if (name) registerGloss(name, "(your name)");
  }, [name]);

  // The island is Swedish-only; older accounts may still have Danish selected.
  const { isLoading, isSwitchingLanguage, selectTargetLanguage } = model;
  const languageCode = model.targetLanguage.code;
  useEffect(() => {
    if (!isLoading && languageCode !== "sv" && !isSwitchingLanguage) {
      void selectTargetLanguage("sv").catch(() => undefined);
    }
  }, [isLoading, isSwitchingLanguage, languageCode, selectTargetLanguage]);

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
    () => computeProgress(model.concepts, model.states, discovered.length),
    [model.concepts, model.states, discovered.length],
  );

  // Celebrate new levels and newly unlocked villagers, but not on first load.
  const seen = useRef<{ level: number; unlocked: Set<VillagerId> } | null>(null);
  useEffect(() => {
    if (model.isLoading || !loaded || languageCode !== "sv") return;
    const unlocked = new Set(villagers.filter((v) => progress.villagers[v.id].unlocked).map((v) => v.id));
    const previous = seen.current;
    seen.current = { level: progress.level, unlocked };
    if (!previous) return;
    if (progress.level > previous.level) {
      sound.play("levelup");
      setGame((s) => ({ celebration: s.celebration + 1 }));
      toast("level", { sv: `${ui.levelUp.sv} ${ui.level.sv} ${progress.level}`, en: `${ui.levelUp.en} Level ${progress.level}` }, ui.treeGrows, 5200);
    }
    for (const id of unlocked) {
      if (!previous.unlocked.has(id)) {
        const villager = villagers.find((v) => v.id === id)!;
        window.setTimeout(() => {
          sound.play("sparkle");
          toast("friend", ui.newFriend(villager.name), villager.place, 5200);
        }, 1400);
      }
    }
  }, [progress, model.isLoading, loaded, languageCode]);

  const unlocked = useMemo(
    () => Object.fromEntries(villagers.map((v) => [v.id, progress.villagers[v.id].unlocked])) as Record<VillagerId, boolean>,
    [progress],
  );

  const ready = loaded && !model.isLoading && model.targetLanguage.code === "sv";
  return (
    <div className={`game-root phase-${phase}`}>
      <Scene
        treeStage={phase === "title" ? Math.max(2, progress.treeStage) : progress.treeStage}
        goal={phase === "title" ? null : introDone ? progress.goal : "elin"}
        unlocked={unlocked}
        quality={quality}
      />
      <WorldLabels unlocked={unlocked} />
      <Hud progress={progress} />
      {phase === "dialogue" && talkingTo ? <Dialogue key={talkingTo} id={talkingTo} progress={progress} liveAvailable={liveAvailable} /> : null}
      <Toasts />
      <Overlays progress={progress} />
      <TitleScreen ready={ready} needsSignIn={false} onPlay={beginPlay} />
      {model.error ? (
        <p className="game-error" role="alert">
          {model.error}
        </p>
      ) : null}
      <TooltipLayer />
    </div>
  );
}
