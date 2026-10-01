"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useIsland } from "../island";
import { useGame } from "../store";
import { GlossedLine } from "./glossed";

export function TitleScreen({ ready, onPlay }: { ready: boolean; onPlay: () => void }) {
  const phase = useGame((s) => s.phase);
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
