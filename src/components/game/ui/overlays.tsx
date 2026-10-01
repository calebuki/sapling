"use client";

import { useState } from "react";
import { GraduationCap, Languages, Lock, LogOut, Shirt, Volume2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { Wardrobe } from "@/components/wardrobe/wardrobe";
import type { GrammarTip } from "@/lib/game/grammar";
import { conceptStage, type GameProgress } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { sound } from "../audio/sfx";
import { speak } from "../audio/speech";
import { island, villagerById, useIsland } from "../island";
import { setGame, updateSave, useGame } from "../store";
import { GrammarTipModal } from "./grammar-tip";
import { StageIcon } from "./stage-icon";
import { Glossed, GlossedLine } from "./glossed";

function close() {
  sound.play("close");
  setGame({ overlay: null });
}

export function Overlays({ progress }: { progress: GameProgress }) {
  const overlay = useGame((s) => s.overlay);
  const { ui, code } = useIsland();
  const { learnerId } = useLearningModel();
  if (!overlay) return null;
  if (overlay === "wardrobe") return <Wardrobe learnerId={learnerId} language={code} onClose={close} />;
  return (
    <div className="overlay" onClick={close}>
      <div className={`overlay-card overlay-${overlay}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="overlay-close" onClick={close} aria-label={aria(ui.close)}>
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
  const grammarSeen = useGame((s) => s.save.grammarSeen);
  const [tab, setTab] = useState<"phrases" | "grammar" | "things">("phrases");
  const [reading, setReading] = useState<GrammarTip | null>(null);
  const { code, course, discoveries, grammar, script, ui } = useIsland();
  const exercises = new Map(course.lessons.flatMap((l) => l.exercises.map((e) => [e.conceptSlug, e] as const)));
  const teacherOf = (unitId: string) => villagerById(course.units.find((u) => u.id === unitId)?.villager ?? island().host);
  const byConcept = new Map(model.states.map((s) => [s.conceptId, s]));

  return (
    <div className="ordbok">
      <h2>
        <GlossedLine line={ui.dictionary} />
      </h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "phrases"} onClick={() => setTab("phrases")}>
          <GlossedLine line={ui.phrases} /> <span className="count">{progress.wordsMet}/{progress.wordsTotal}</span>
        </button>
        <button role="tab" aria-selected={tab === "grammar"} onClick={() => setTab("grammar")}>
          <GlossedLine line={ui.grammar} /> <span className="count">{grammarSeen.length}/{grammar.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "things"} onClick={() => setTab("things")}>
          <GlossedLine line={ui.things} /> <span className="count">{discovered.length}/{discoveries.length}</span>
        </button>
      </div>
      {reading ? <GrammarTipModal tip={reading} review onDone={() => setReading(null)} /> : null}
      {tab === "grammar" ? (
        <div className="ordbok-scroll grammar-list">
          {grammar.map((tip) => {
            const villager = teacherOf(tip.unit);
            const seen = grammarSeen.includes(tip.id);
            return seen ? (
              <button key={tip.id} className="thing is-found" onClick={() => { sound.play("click"); setReading(tip); }}>
                <GraduationCap size={18} />
                <GlossedLine line={tip.title} />
                <span className="thing-en">
                  {tip.title.en} · {villager.name}
                </span>
              </button>
            ) : (
              <div key={tip.id} className="thing">
                <Lock size={16} />
                <span className="thing-en">{villager.name}</span>
              </div>
            );
          })}
        </div>
      ) : tab === "phrases" ? (
        <div className="ordbok-scroll">
          {progress.units.map((standing) => {
            const v = villagerById(standing.unit.villager);
            return (
              <section key={standing.unit.id} className={standing.unlocked ? "" : "is-locked"}>
                <h3>
                  <span className="dot" style={{ background: v.look.accent }} /> <GlossedLine line={standing.unit.title} /> · {v.name}
                  <span className="count">
                    {standing.met}/{standing.total}
                  </span>
                  {!standing.unlocked ? <Lock size={14} /> : null}
                </h3>
                {!standing.unlocked ? null : <ul>
                  {standing.unit.slugs.map((slug) => {
                    const concept = model.concepts.find((c) => c.slug === slug && c.languageCode === code);
                    if (!concept) return null;
                    const state = byConcept.get(concept.id);
                    const stage = conceptStage(state);
                    const exercise = exercises.get(slug);
                    return (
                      <li key={slug} className={stage === 0 ? "is-unknown" : ""}>
                        <StageIcon stage={stage} />
                        {stage === 0 ? (
                          <span className="unknown">
                            <GlossedLine line={ui.notMet} />
                          </span>
                        ) : (
                          <>
                            <Glossed text={concept.canonicalForm} en={concept.gloss} className="ordbok-word" />
                            <span className="ordbok-gloss">{concept.gloss}</span>
                            <GlossedLine line={script.stageNames[stage]} className="ordbok-stage" />
                            <button
                              className="icon-button"
                              aria-label={aria(ui.listen)}
                              onClick={() => void speak(exercise?.expected ?? concept.canonicalForm, { clipId: exercise?.audioId })}
                            >
                              <Volume2 size={16} />
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="ordbok-scroll things-grid">
          {discoveries.map((item) =>
            discovered.includes(item.id) ? (
              <button key={item.id} className="thing is-found" onClick={() => void speak(item.t)}>
                <Glossed text={item.t} en={item.en} />
                <span className="thing-en">{item.en}</span>
              </button>
            ) : (
              <div key={item.id} className="thing">
                <span className="thing-unknown">?</span>
                <GlossedLine line={ui.notFound} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function GameMenu() {
  const english = useGame((s) => s.save.english);
  const { ui } = useIsland();
  const englishLabel = { auto: ui.englishAuto, on: ui.englishOn, off: ui.englishOff }[english];
  const router = useRouter();
  return (
    <div className="game-menu">
      <h2>
        <GlossedLine line={ui.menu} />
      </h2>
      <button
        className="btn"
        onClick={() => {
          sound.play("click");
          updateSave({ english: english === "auto" ? "on" : english === "on" ? "off" : "auto" });
        }}
      >
        <Languages size={18} /> <GlossedLine line={englishLabel} />
      </button>
      <button
        className="btn"
        onClick={() => {
          sound.play("open");
          setGame({ overlay: "wardrobe" });
        }}
      >
        <Shirt size={18} /> <GlossedLine line={ui.yourStyle} />
      </button>
      <div className="controls-help">
        <GlossedLine line={ui.controls} as="strong" />
        <GlossedLine line={ui.controlsMove} as="p" />
        <GlossedLine line={ui.controlsRun} as="p" />
        <GlossedLine line={ui.controlsTalk} as="p" />
        <GlossedLine line={ui.controlsCamera} as="p" />
        <GlossedLine line={ui.hoverHint} as="p" />
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
          <LogOut size={18} /> <GlossedLine line={ui.signOut} />
        </button>
      ) : null}
    </div>
  );
}
