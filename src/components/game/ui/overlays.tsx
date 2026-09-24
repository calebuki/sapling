"use client";

import { useState } from "react";
import { Languages, Lock, LogOut, Music, Volume2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { getCourse } from "@/lib/learning/course";
import { discoveries } from "@/lib/game/discoveries";
import { conceptStage, stageNames, type GameProgress } from "@/lib/game/progression";
import { ui } from "@/lib/game/ui-text";
import { villagers } from "@/lib/game/villagers";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { sound } from "../audio/sfx";
import { speakSwedish } from "../audio/speech";
import { setGame, updateSave, useGame } from "../store";
import { outfits } from "../world/actors";
import { StageIcon } from "./stage-icon";
import { Sv, SvLine } from "./sv";

function close() {
  sound.play("close");
  setGame({ overlay: null });
}

export function Overlays({ progress }: { progress: GameProgress }) {
  const overlay = useGame((s) => s.overlay);
  if (!overlay) return null;
  return (
    <div className="overlay" onClick={close}>
      <div className={`overlay-card overlay-${overlay}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="overlay-close" onClick={close} aria-label="Stäng (close)">
          <X size={20} />
        </button>
        {overlay === "ordbok" ? <Ordbok progress={progress} /> : <GameMenu />}
      </div>
    </div>
  );
}

function Ordbok({ progress }: { progress: GameProgress }) {
  const model = useLearningModel();
  const discovered = useGame((s) => s.save.discovered);
  const [tab, setTab] = useState<"phrases" | "things">("phrases");
  const exercises = new Map(getCourse("sv").lessons.flatMap((l) => l.exercises.map((e) => [e.conceptSlug, e] as const)));
  const byConcept = new Map(model.states.map((s) => [s.conceptId, s]));

  return (
    <div className="ordbok">
      <h2>
        <SvLine line={ui.dictionary} />
      </h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "phrases"} onClick={() => setTab("phrases")}>
          <SvLine line={ui.phrases} /> <span className="count">{progress.wordsMet}/{progress.wordsTotal}</span>
        </button>
        <button role="tab" aria-selected={tab === "things"} onClick={() => setTab("things")}>
          <SvLine line={ui.things} /> <span className="count">{discovered.length}/{discoveries.length}</span>
        </button>
      </div>
      {tab === "phrases" ? (
        <div className="ordbok-scroll">
          {villagers.map((v) => {
            const standing = progress.villagers[v.id];
            return (
              <section key={v.id} className={standing.unlocked ? "" : "is-locked"}>
                <h3>
                  <span className="dot" style={{ background: v.look.accent }} /> {v.name} ·{" "}
                  <Sv text={v.place.sv} en={v.place.en} />
                  {!standing.unlocked ? <Lock size={14} /> : null}
                </h3>
                <ul>
                  {v.conceptSlugs.map((slug) => {
                    const concept = model.concepts.find((c) => c.slug === slug && c.languageCode === "sv");
                    if (!concept) return null;
                    const state = byConcept.get(concept.id);
                    const stage = conceptStage(state);
                    const exercise = exercises.get(slug);
                    return (
                      <li key={slug} className={stage === 0 ? "is-unknown" : ""}>
                        <StageIcon stage={stage} />
                        {stage === 0 ? (
                          <span className="unknown">
                            <SvLine line={ui.notMet} />
                          </span>
                        ) : (
                          <>
                            <Sv text={concept.canonicalForm} en={concept.gloss} className="ordbok-word" />
                            <span className="ordbok-gloss">{concept.gloss}</span>
                            <Sv text={stageNames[stage].sv} en={stageNames[stage].en} className="ordbok-stage" />
                            <button
                              className="icon-button"
                              aria-label="Lyssna (listen)"
                              onClick={() => void speakSwedish(exercise?.expected ?? concept.canonicalForm, { clipId: exercise?.audioId })}
                            >
                              <Volume2 size={16} />
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="ordbok-scroll things-grid">
          {discoveries.map((item) =>
            discovered.includes(item.id) ? (
              <button key={item.id} className="thing is-found" onClick={() => void speakSwedish(item.sv)}>
                <Sv text={item.sv} en={item.en} />
                <span className="thing-en">{item.en}</span>
              </button>
            ) : (
              <div key={item.id} className="thing">
                <span className="thing-unknown">?</span>
                <SvLine line={ui.notFound} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function GameMenu() {
  const music = useGame((s) => s.music);
  const outfit = useGame((s) => s.save.outfit);
  const english = useGame((s) => s.save.english);
  const englishLabel = { auto: { sv: "Engelska: auto", en: "English subtitles: automatic" }, on: { sv: "Engelska: på", en: "English subtitles: on" }, off: { sv: "Engelska: av", en: "English subtitles: off" } }[english];
  const router = useRouter();
  return (
    <div className="game-menu">
      <h2>
        <SvLine line={ui.menu} />
      </h2>
      <button
        className="btn"
        onClick={() => {
          sound.setMusic(!music);
          if (!music) sound.startMusic();
          setGame({ music: !music });
        }}
      >
        <Music size={18} /> <SvLine line={music ? ui.musicOff : ui.musicOn} />
      </button>
      <button
        className="btn"
        onClick={() => {
          sound.play("click");
          updateSave({ english: english === "auto" ? "on" : english === "on" ? "off" : "auto" });
        }}
      >
        <Languages size={18} /> <SvLine line={englishLabel} />
      </button>
      <div className="outfit-picker">
        <Sv text="Din stil" en="Your style" />
        <div>
          {outfits.map((o, i) => (
            <button
              key={i}
              aria-label={`Stil ${i + 1} (style ${i + 1})`}
              aria-pressed={outfit === i}
              style={{ background: o.shirt }}
              onClick={() => {
                sound.play("pop");
                updateSave({ outfit: i });
              }}
            />
          ))}
        </div>
      </div>
      <div className="controls-help">
        <SvLine line={ui.controls} as="strong" />
        <SvLine line={ui.controlsMove} as="p" />
        <SvLine line={ui.controlsRun} as="p" />
        <SvLine line={ui.controlsTalk} as="p" />
        <SvLine line={ui.controlsCamera} as="p" />
        <SvLine line={ui.hoverHint} as="p" />
      </div>
      {hasSupabase ? (
        <button
          className="btn btn-quiet"
          onClick={async () => {
            await createClient().auth.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogOut size={18} /> <SvLine line={ui.signOut} />
        </button>
      ) : null}
    </div>
  );
}
