"use client";

import type { VillagerId } from "@/lib/game/villagers";
import { sound } from "./audio/sfx";
import { speak } from "./audio/speech";
import { island } from "./island";
import { emote, getGame, runtime, setGame, toast, updateSave, type Interactable } from "./store";

// The few verbs the whole game is built on: walk, look, talk.

export function interact(target: Interactable) {
  const game = getGame();
  if (game.phase !== "explore" || game.overlay) return;
  if (performance.now() - runtime.lastInteraction < 400) return;
  runtime.lastInteraction = performance.now();
  runtime.walkTarget = null;
  if (target.kind === "villager") startDialogue(target.id);
  else discover(target.id);
}

export function startDialogue(id: VillagerId) {
  sound.play("open");
  setGame({ phase: "dialogue", talkingTo: id, nearby: null });
}

export function endDialogue() {
  sound.play("close");
  setGame({ phase: "explore", talkingTo: null });
}

export function discover(id: string) {
  const item = island().discoveries.find((d) => d.id === id);
  if (!item) return;
  const { save } = getGame();
  if (!save.discovered.includes(id)) {
    updateSave({ discovered: [...save.discovered, id] });
    sound.play("discover");
    emote("player", "happy", 1200);
    toast("word", island().ui.newWord, { t: item.t, en: item.en });
  } else {
    sound.play("pop");
  }
  void speak(item.t, { who: "player" });
}
