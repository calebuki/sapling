"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, MessageCircle, Phone, Volume2 } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { getPracticeScenario } from "@/lib/practice/scenarios";
import type { GameProgress } from "@/lib/game/progression";
import { ui } from "@/lib/game/ui-text";
import { elinAfterName, elinIntro, getVillager, pick, type Line, type VillagerId } from "@/lib/game/villagers";
import { endDialogue } from "../actions";
import { sound } from "../audio/sfx";
import { speakSwedish, stopSpeaking } from "../audio/speech";
import { emote, updateSave, useGame } from "../store";
import { Chat } from "./chat";
import { LessonRound, RoundSummaryView, type RoundSummary } from "./lesson-round";
import { LiveCall } from "./live-call";
import { registerGloss, Sv, SvLine } from "./sv";
import { Typewriter } from "./typewriter";

type Mode = "lines" | "name" | "menu" | "lesson" | "summary" | "live" | "chat";

export function Dialogue({ id, progress, liveAvailable }: { id: VillagerId; progress: GameProgress; liveAvailable: boolean }) {
  const villager = getVillager(id);
  const model = useLearningModel();
  const save = useGame((s) => s.save);
  const standing = progress.villagers[id];
  // The opening script depends only on who this is and how far along we are.
  const [opening] = useState(() =>
    id === "elin" && !save.introDone
      ? { lines: elinIntro, then: "name" as const }
      : !standing.unlocked
        ? { lines: [villager.locked], then: "end" as const }
        : { lines: [pick(villager.greetings)], then: "menu" as const },
  );
  const [mode, setMode] = useState<Mode>("lines");
  const [lines, setLines] = useState<Line[]>(opening.lines);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(false);
  const [round, setRound] = useState(0);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const after = useRef<() => void>(() => (opening.then === "end" ? endDialogue() : setMode(opening.then)));

  const say = (next: Line[], then: () => void) => {
    setLines(next);
    setIndex(0);
    setTyped(false);
    setMode("lines");
    after.current = then;
  };

  useEffect(() => {
    emote(id, "wave", 1400);
    return () => stopSpeaking();
  }, [id]);

  const canTalk = useMemo(() => {
    const scenario = getPracticeScenario("sv", villager.scenarioId);
    if (!scenario) return false;
    const recommendation = choosePracticeScenario({
      languageCode: "sv",
      concepts: model.concepts,
      states: model.states,
      snapshot: model.practiceSnapshot,
      scenarioIds: [scenario.id],
    });
    return recommendation.encounteredConceptSlugs.length >= Math.max(2, scenario.minimumEncountered) && standing.met >= 3;
  }, [model.concepts, model.states, model.practiceSnapshot, villager.scenarioId, standing.met]);

  const advanceLine = () => {
    if (!typed) {
      setTyped(true);
      return;
    }
    sound.play("click");
    if (index + 1 < lines.length) {
      setIndex(index + 1);
      setTyped(false);
    } else after.current();
  };

  // Space / Enter advance spoken lines.
  useEffect(() => {
    if (mode !== "lines") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key.toLowerCase() === "e") {
        e.preventDefault();
        advanceLine();
      }
      if (e.key === "Escape") endDialogue();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const line = lines[index];
  return (
    <div className="dialogue" role="dialog" aria-label={villager.name}>
      <div className="dialogue-plate">
        <span className="dialogue-name" style={{ background: villager.look.accent }}>
          {villager.name}
        </span>
        <Sv text={villager.role.sv} en={villager.role.en} className="dialogue-role" />
        <button className="dialogue-close" aria-label="Hej då (bye)" onClick={endDialogue}>
          ×
        </button>
      </div>
      <div className="dialogue-body">
        {mode === "lines" && line ? (
          <div className="dialogue-lines" onClick={advanceLine}>
            <Typewriter key={`${index}:${line.sv}`} line={line} pitch={villager.voicePitch} done={typed} onDone={() => setTyped(true)} />
            <div className="dialogue-line-tools">
              <button
                className="icon-button"
                aria-label="Lyssna (listen)"
                onClick={(e) => {
                  e.stopPropagation();
                  void speakSwedish(line.sv, { who: id, pitch: villager.voicePitch });
                }}
              >
                <Volume2 size={17} />
              </button>
              {typed ? <span className="dialogue-more" aria-hidden="true">▼</span> : null}
            </div>
          </div>
        ) : null}

        {mode === "name" ? (
          <NameEntry
            onSubmit={(name) => {
              registerGloss(name, "(your name)");
              updateSave({ name });
              sound.play("sparkle");
              emote(id, "happy", 1600);
              say(elinAfterName(name), () => {
                updateSave({ introDone: true });
                setMode("lesson");
              });
            }}
          />
        ) : null}

        {mode === "menu" ? (
          <div className="dialogue-menu">
            <button className="btn btn-primary" onClick={() => { sound.play("click"); setRound((r) => r + 1); setMode("lesson"); }} autoFocus>
              <BookOpen size={18} /> <SvLine line={villager.teach} />
            </button>
            <button
              className="btn"
              disabled={!canTalk}
              title={canTalk ? undefined : ui.notReadyToTalk.en}
              onClick={() => {
                sound.play("click");
                setMode(liveAvailable ? "live" : "chat");
              }}
            >
              {liveAvailable ? <Phone size={18} /> : <MessageCircle size={18} />} <SvLine line={villager.talk} />
            </button>
            <button className="btn btn-quiet" onClick={() => say([pick(villager.goodbye)], endDialogue)}>
              <SvLine line={ui.bye} />
            </button>
            {!canTalk ? (
              <p className="dialogue-hint">
                <SvLine line={ui.notReadyToTalk} />
              </p>
            ) : null}
          </div>
        ) : null}

        {mode === "lesson" ? (
          <LessonRound
            key={round}
            villager={villager}
            onFinish={(result) => {
              setSummary(result);
              setMode("summary");
            }}
          />
        ) : null}

        {mode === "summary" && summary ? (
          <RoundSummaryView
            summary={summary}
            villager={villager}
            onAgain={() => {
              setRound((r) => r + 1);
              setMode("lesson");
            }}
            onBye={() => say([pick(villager.goodbye)], endDialogue)}
            extra={
              canTalk ? (
                <button className="btn" onClick={() => setMode(liveAvailable ? "live" : "chat")}>
                  {liveAvailable ? <Phone size={18} /> : <MessageCircle size={18} />} <SvLine line={villager.talk} />
                </button>
              ) : null
            }
          />
        ) : null}

        {mode === "live" ? <LiveCall villager={villager} onClose={() => setMode("menu")} onFallback={() => setMode("chat")} /> : null}
        {mode === "chat" ? <Chat villager={villager} onClose={() => setMode("menu")} /> : null}
      </div>
    </div>
  );
}

function NameEntry({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="name-entry"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = name.trim().replace(/\s+/g, " ").slice(0, 24);
        if (clean) onSubmit(clean);
      }}
    >
      <p>
        <Sv text="Jag heter…" en="My name is…" />
      </p>
      <div className="answer-row">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={ui.yourName.sv} aria-label="Ditt namn (your name)" maxLength={24} />
        <button className="btn btn-primary" disabled={!name.trim()} type="submit">
          <SvLine line={ui.next} />
        </button>
      </div>
    </form>
  );
}
