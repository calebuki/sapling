"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { aria } from "@/lib/game/ui-text";
import { sound } from "../audio/sfx";
import { useIsland } from "../island";
import { updateSave, useGame } from "../store";
import { outfits } from "../world/actors";
import { GlossedLine } from "./glossed";

export function TitleScreen({ ready, onPlay }: { ready: boolean; onPlay: () => void }) {
  const phase = useGame((s) => s.phase);
  const outfit = useGame((s) => s.save.outfit);
  const name = useGame((s) => s.save.name);
  const { ui } = useIsland();
  if (phase !== "title") return null;
  return (
    <div className="title-screen">
      <div className="title-card">
        <GlossedLine line={ui.presents} as="p" className="title-kicker" />
        <h1 className="title-logo">
          <GlossedLine line={ui.title} />
        </h1>
        <GlossedLine line={ui.tagline} as="p" className="title-tagline" />
        <div className="title-outfits" aria-label={aria(ui.yourStyle)}>
          {outfits.map((o, i) => (
            <button
              key={i}
              aria-pressed={outfit === i}
              aria-label={`${ui.style.t} ${i + 1} (style ${i + 1})`}
              style={{ background: o.shirt }}
              onClick={() => {
                sound.play("pop");
                updateSave({ outfit: i });
              }}
            />
          ))}
        </div>
        <button className="btn btn-primary btn-big" disabled={!ready} onClick={onPlay} autoFocus>
          {ready ? (
            <>
              <GlossedLine line={name ? ui.welcomeBack(name) : ui.play} /> <ArrowRight size={20} />
            </>
          ) : (
            <>
              <LoaderCircle className="spin" size={20} /> <GlossedLine line={ui.loading} />
            </>
          )}
        </button>
        <GlossedLine line={ui.hoverHint} as="p" className="title-hint" />
        <Link className="title-back" href="/">
          <ArrowLeft size={16} /> All islands
        </Link>
      </div>
    </div>
  );
}
