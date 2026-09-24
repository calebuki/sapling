"use client";

import { getDiscovery } from "@/lib/game/discoveries";
import { ui } from "@/lib/game/ui-text";
import type { VillagerId } from "@/lib/game/villagers";
import { sound } from "./audio/sfx";
import { speakSwedish } from "./audio/speech";
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
  const item = getDiscovery(id);
  if (!item) return;
  const { save } = getGame();
  if (!save.discovered.includes(id)) {
    updateSave({ discovered: [...save.discovered, id] });
    sound.play("discover");
    emote("player", "happy", 1200);
    toast("word", ui.newWord, { sv: item.sv, en: item.en });
  } else {
    sound.play("pop");
  }
  void speakSwedish(item.sv, { who: "player" });
}
