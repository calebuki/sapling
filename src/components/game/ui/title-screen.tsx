"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { ui } from "@/lib/game/ui-text";
import { sound } from "../audio/sfx";
import { updateSave, useGame } from "../store";
import { outfits } from "../world/actors";
import { Sv, SvLine } from "./sv";

export function TitleScreen({ ready, needsSignIn, onPlay }: { ready: boolean; needsSignIn: boolean; onPlay: () => void }) {
  const phase = useGame((s) => s.phase);
  const outfit = useGame((s) => s.save.outfit);
  const name = useGame((s) => s.save.name);
  if (phase !== "title") return null;
  return (
    <div className="title-screen">
      <div className="title-card">
        <p className="title-kicker">
          <Sv text="Sapling presenterar" en="Sapling presents" />
        </p>
        <h1 className="title-logo">
          <Sv text="Lilla Ö" en="Little Island" />
        </h1>
        <SvLine line={ui.tagline} as="p" className="title-tagline" />
        {!needsSignIn ? (
          <div className="title-outfits" aria-label="Välj din stil (choose your style)">
            {outfits.map((o, i) => (
              <button
                key={i}
                aria-pressed={outfit === i}
                aria-label={`Stil ${i + 1} (style ${i + 1})`}
                style={{ background: o.shirt }}
                onClick={() => {
                  sound.play("pop");
                  updateSave({ outfit: i });
                }}
              />
            ))}
          </div>
        ) : null}
        {needsSignIn ? (
          <Link className="btn btn-primary btn-big" href="/login">
            <SvLine line={ui.signIn} /> <ArrowRight size={20} />
          </Link>
        ) : (
          <button className="btn btn-primary btn-big" disabled={!ready} onClick={onPlay} autoFocus>
            {ready ? (
              <>
                <SvLine line={name ? { sv: `Välkommen tillbaka, ${name}!`, en: `Welcome back, ${name}!` } : ui.play} />{" "}
                <ArrowRight size={20} />
              </>
            ) : (
              <>
                <LoaderCircle className="spin" size={20} /> <SvLine line={ui.loading} />
              </>
            )}
          </button>
        )}
        <SvLine line={ui.hoverHint} as="p" className="title-hint" />
      </div>
    </div>
  );
}
