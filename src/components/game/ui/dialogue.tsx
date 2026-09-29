"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, GraduationCap, MessageCircle, Phone, Volume2 } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { getPracticeScenario } from "@/lib/practice/scenarios";
import { pendingTip, type GrammarTip } from "@/lib/game/grammar";
import { pick, type Line } from "@/lib/game/line";
import { teachableSlugs, type GameProgress } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { VillagerId } from "@/lib/game/villagers";
import { endDialogue } from "../actions";
import { sound } from "../audio/sfx";
import { prefetchSpeech, speak, stopSpeaking } from "../audio/speech";
import { island, villagerById, useIsland } from "../island";
import { emote, updateSave, useGame } from "../store";
import { CafeRound } from "./cafe-round";
import { Chat } from "./chat";
import { SceneRound } from "./scene-round";
import { GrammarTipModal } from "./grammar-tip";
import { RoundSummaryView, type RoundSummary } from "./lesson-round";
import { LiveCall } from "./live-call";
import { registerGloss, Glossed, GlossedLine } from "./glossed";
import { Typewriter } from "./typewriter";

type Mode = "lines" | "name" | "menu" | "tip" | "lesson" | "summary" | "live" | "chat";

export function Dialogue({ id, progress, liveAvailable }: { id: VillagerId; progress: GameProgress; liveAvailable: boolean }) {
  const { code, host, script, ui, grammar } = useIsland();
  const villager = villagerById(id);
  const model = useLearningModel();
  const save = useGame((s) => s.save);
  const standing = progress.villagers[id];
  // The opening script depends only on who this is and how far along we are.
  const [opening] = useState(() =>
    id === host && !save.introDone
      ? { lines: script.intro, then: "name" as const }
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
  const [tip, setTip] = useState<GrammarTip | null>(null);
  const openUnits = standing.units.filter((u) => u.unlocked).map((u) => ({ id: u.unit.id, met: u.met }));
  const upcomingTip = pendingTip(grammar, openUnits, save.grammarSeen);
  // Fixed while the dialogue is open, so a round never loses phrases midway.
  const [slugs] = useState(() => teachableSlugs(progress, id));
  const showEnglish = save.english === "on" || (save.english === "auto" && save.experience === "new" && progress.level < 5);

  const finishRound = (result: RoundSummary) => {
    setSummary(result);
    setMode("summary");
  };

  // A pending grammar tip always comes before the next lesson round.
  const startLesson = () => {
    setRound((r) => r + 1);
    if (upcomingTip) {
      setTip(upcomingTip);
      setMode("tip");
    } else setMode("lesson");
  };

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

  // Fetch the voice for the line on screen so "listen" plays without a wait.
  const shownLine = mode === "lines" ? lines[index]?.t : undefined;
  useEffect(() => {
    if (shownLine) prefetchSpeech(shownLine, { who: id, pitch: villager.voicePitch });
  }, [shownLine, id, villager.voicePitch]);

  const canTalk = useMemo(() => {
    const scenario = villager.scenarioId ? getPracticeScenario(code, villager.scenarioId) : undefined;
    if (!scenario) return false;
    const recommendation = choosePracticeScenario({
      languageCode: code,
      concepts: model.concepts,
      states: model.states,
      snapshot: model.practiceSnapshot,
      scenarioIds: [scenario.id],
    });
    return recommendation.encounteredConceptSlugs.length >= Math.max(2, scenario.minimumEncountered) && standing.met >= 3;
  }, [code, model.concepts, model.states, model.practiceSnapshot, villager.scenarioId, standing.met]);

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
  // A grammar tip takes the place of the dialogue card rather than stacking on it.
  if (mode === "tip" && tip) {
    return (
      <GrammarTipModal
        tip={tip}
        onDone={() => {
          updateSave({ grammarSeen: [...new Set([...save.grammarSeen, tip.id])] });
          setTip(null);
          setMode("lesson");
        }}
      />
    );
  }
  return (
    <div className={`dialogue ${mode === "lesson" ? "is-lesson" : ""}`} role="dialog" aria-label={villager.name}>
      <div className="dialogue-plate">
        <span className="dialogue-name" style={{ background: villager.look.accent }}>
          {villager.name}
        </span>
        <Glossed text={villager.role.t} en={villager.role.en} className="dialogue-role" />
        <button className="dialogue-close" aria-label={aria(ui.bye)} onClick={endDialogue}>
          ×
        </button>
      </div>
      <div className="dialogue-body">
        {mode === "lines" && line ? (
          <div className="dialogue-lines" onClick={advanceLine}>
            <Typewriter key={`${index}:${line.t}`} line={line} pitch={villager.voicePitch} done={typed} onDone={() => setTyped(true)} english={showEnglish} />
            <div className="dialogue-line-tools">
              <button
                className="icon-button"
                aria-label={aria(ui.listen)}
                onClick={(e) => {
                  e.stopPropagation();
                  void speak(line.t, { who: id, pitch: villager.voicePitch });
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
            initial={save.name ?? ""}
            onSubmit={(name) => {
              registerGloss(name, "(your name)");
              updateSave({ name });
              sound.play("sparkle");
              emote(id, "happy", 1600);
              say(script.afterName(name), () => {
                updateSave({ introDone: true });
                startLesson();
              });
            }}
          />
        ) : null}

        {mode === "menu" ? (
          <div className="dialogue-menu">
            <button className="btn btn-primary" onClick={() => { sound.play("click"); startLesson(); }} autoFocus>
              <BookOpen size={18} /> <GlossedLine line={villager.teach} />
              {upcomingTip ? (
                <span className="tip-badge">
                  <GraduationCap size={14} /> <GlossedLine line={ui.newGrammar} />
                </span>
              ) : null}
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
              {liveAvailable ? <Phone size={18} /> : <MessageCircle size={18} />} <GlossedLine line={villager.talk} />
            </button>
            <button className="btn btn-quiet" onClick={() => say([pick(villager.goodbye)], endDialogue)}>
              <GlossedLine line={ui.bye} />
            </button>
            {!canTalk ? (
              <p className="dialogue-hint">
                <GlossedLine line={ui.notReadyToTalk} />
              </p>
            ) : null}
          </div>
        ) : null}

        {mode === "lesson" ? (
          // Every villager teaches in their own place: café hosts at their counter, the others through little exchanges.
          villager.round === "cafe" && island().cafe ? (
            <CafeRound key={round} villager={villager} slugs={slugs} onFinish={finishRound} />
          ) : (
            <SceneRound key={round} villager={villager} slugs={slugs} onFinish={finishRound} />
          )
        ) : null}

        {mode === "summary" && summary ? (
          <RoundSummaryView
            summary={summary}
            villager={villager}
            onAgain={startLesson}
            onBye={() => say([pick(villager.goodbye)], endDialogue)}
            extra={
              canTalk ? (
                <button className="btn" onClick={() => setMode(liveAvailable ? "live" : "chat")}>
                  {liveAvailable ? <Phone size={18} /> : <MessageCircle size={18} />} <GlossedLine line={villager.talk} />
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

function NameEntry({ initial, onSubmit }: { initial: string; onSubmit: (name: string) => void }) {
  const { ui } = useIsland();
  const [name, setName] = useState(initial);
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
        <GlossedLine line={ui.myNameIs} />
      </p>
      <div className="answer-row">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={ui.yourName.t} aria-label={aria(ui.yourName)} maxLength={24} />
        <button className="btn btn-primary" disabled={!name.trim()} type="submit">
          <GlossedLine line={ui.next} />
        </button>
      </div>
    </form>
  );
}
