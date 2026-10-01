"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Shirt } from "lucide-react";
import { lookOf, newIds } from "@/lib/game/wardrobe";
import { outfitOf, useWearRecord } from "./store";

const PlayerPreviewScene = dynamic(() => import("./player-preview").then((m) => m.PlayerPreviewScene), { ssr: false });

// The way into the wardrobe from the hub: the player, standing at the left of
// the welcome.

export function PlayerPreview({ onOpen, paused }: { onOpen: () => void; paused: boolean }) {
  const record = useWearRecord();
  const look = useMemo(() => lookOf(outfitOf(record)), [record]);
  const fresh = useMemo(() => newIds(record).length > 0, [record]);
  return (
    <button className="player-preview" onClick={onOpen} aria-label="Open your wardrobe">
      <span className="player-preview-stage" aria-hidden="true">
        {paused ? null : <PlayerPreviewScene look={look} />}
      </span>
      <span className="player-preview-label">
        <Shirt size={16} aria-hidden="true" /> Wardrobe
        {fresh ? <span className="wardrobe-dot" aria-label="(new things)" /> : null}
      </span>
    </button>
  );
}
