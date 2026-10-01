"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Shirt } from "lucide-react";
import { lookOf, newIds } from "@/lib/game/wardrobe";
import { outfitOf, useWardrobe } from "./store";

const PlayerPreviewScene = dynamic(() => import("./player-preview").then((m) => m.PlayerPreviewScene), { ssr: false });

// Ways into the wardrobe from the hub: the player standing beside Sapling,
// and a button in the top bar for screens too narrow to show them.

function useHasNew() {
  const record = useWardrobe((s) => s.record);
  return useMemo(() => newIds(record).length > 0, [record]);
}

export function PlayerPreview({ onOpen, paused }: { onOpen: () => void; paused: boolean }) {
  const record = useWardrobe((s) => s.record);
  const look = useMemo(() => lookOf(outfitOf(record)), [record]);
  const fresh = useHasNew();
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

export function WardrobeButton({ onOpen }: { onOpen: () => void }) {
  const fresh = useHasNew();
  return (
    <button className="btn btn-quiet hub-account" onClick={onOpen}>
      <Shirt size={17} aria-hidden="true" /> Wardrobe
      {fresh ? <span className="wardrobe-dot" aria-label="(new things)" /> : null}
    </button>
  );
}
