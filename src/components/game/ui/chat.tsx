"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Mic, Send } from "lucide-react";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { getPracticeScenario } from "@/lib/practice/scenarios";
import { ui } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import type { PracticeTurnResponse } from "@/types/practice";
import { sound } from "../audio/sfx";
import { canRecognizeSpeech, listenSwedish, speakSwedish, stopListening } from "../audio/speech";
import { emote } from "../store";
import { Sv, SvLine } from "./sv";

type Message = { role: "learner" | "character"; text: string; en?: string };

// Typed (or browser-dictated) conversation for when live voice is unavailable.
export function Chat({ villager, onClose }: { villager: Villager; onClose: () => void }) {
  const model = useLearningModel();
  const scenario = getPracticeScenario("sv", villager.scenarioId)!;
  const recommendation = useMemo(
    () =>
      choosePracticeScenario({
        languageCode: "sv",
        concepts: model.concepts,
        states: model.states,
        snapshot: model.practiceSnapshot,
        scenarioIds: [scenario.id],
      }),
    // Fixed for the length of this conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [messages, setMessages] = useState<Message[]>([{ role: "character", text: scenario.openingLine, en: scenario.openingEnglish }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const sessionId = useRef<Promise<string> | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void speakSwedish(scenario.openingLine, { who: villager.id, pitch: villager.voicePitch });
    sessionId.current = model.startPracticeSession({
      languageCode: "sv",
      scenarioId: scenario.id,
      characterId: villager.id,
      readiness: recommendation.readiness,
      encounteredConceptSlugs: recommendation.encounteredConceptSlugs,
    });
    sessionId.current.catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string, speech?: { alternatives: string[] }) {
    if (!text.trim() || busy || done) return;
    setBusy(true);
    setFailed(false);
    const turnIndex = messages.filter((m) => m.role === "learner").length;
    const history = messages.slice(-12).map(({ role, text }) => ({ role, text }));
    setMessages((m) => [...m, { role: "learner", text }]);
    setInput("");
    try {
      const id = await sessionId.current!;
      const response = await fetch("/api/practice/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageCode: "sv",
          scenarioId: scenario.id,
          turnIndex,
          transcript: text.trim(),
          alternatives: speech?.alternatives ?? [],
          inputMode: speech ? "speech" : "text",
          history,
          encounteredConceptSlugs: recommendation.encounteredConceptSlugs,
          memories: model.practiceSnapshot.memories.slice(0, 30).map(({ label, value, category }) => ({ label, value, category })),
          continuitySummary: model.practiceSnapshot.continuity.find((c) => c.characterId === villager.id)?.summary ?? null,
        }),
      });
      const body = (await response.json()) as PracticeTurnResponse;
      if (!response.ok) throw new Error();
      await model.recordPracticeTurn({
        sessionId: id,
        languageCode: "sv",
        scenarioId: scenario.id,
        characterId: villager.id,
        position: turnIndex,
        resolution: body.resolution,
        alternatives: speech?.alternatives ?? [],
        replyText: body.reply,
        meaningScore: body.meaningScore,
        grammarScore: body.grammarScore,
        vocabularyScore: body.vocabularyScore,
        speechMetrics: { durationMs: 0, accuracyScore: null, fluencyScore: null, completenessScore: null, pronunciationScore: null },
        evidence: body.evidence,
        memories: body.memories,
      });
      setMessages((m) => [...m, { role: "character", text: body.reply, en: body.englishSupport }]);
      void speakSwedish(body.reply, { who: villager.id, pitch: villager.voicePitch });
      if (body.meaningScore >= 0.7) {
        sound.play("correct");
        emote(villager.id, "happy", 1200);
      }
      if (body.complete) {
        await model.completePracticeSession({
          sessionId: id,
          languageCode: "sv",
          scenarioId: scenario.id,
          characterId: villager.id,
          turnCount: turnIndex + 1,
          goalProgress: body.goalProgress,
          summary: body.continuityNote,
        });
        setDone(body.feedback);
        if (body.goalProgress >= 1) sound.play("levelup");
      }
    } catch {
      setFailed(true);
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => field.current?.focus());
    }
  }

  async function dictate() {
    if (listening) return stopListening();
    setListening(true);
    try {
      const result = await listenSwedish((t) => setInput(t));
      if (result.transcript) await send(result.transcript, { alternatives: result.alternatives });
    } catch {
    } finally {
      setListening(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat-log" ref={list}>
        {messages.map((m, i) => (
          <p key={i} className={`chat-bubble ${m.role === "learner" ? "is-you" : ""}`}>
            <Sv text={m.text} en={m.en} />
          </p>
        ))}
        {busy ? (
          <p className="chat-bubble is-typing">
            <LoaderCircle className="spin" size={16} />
          </p>
        ) : null}
      </div>
      {done ? (
        <div className="chat-done">
          <p>{done}</p>
          <div className="dialogue-actions">
            <button className="btn btn-primary" onClick={onClose} autoFocus>
              <SvLine line={ui.back} />
            </button>
          </div>
        </div>
      ) : (
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            ref={field}
            lang="sv"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.typeReply.sv}
            aria-label="Svara på svenska (answer in Swedish)"
            autoComplete="off"
            spellCheck={false}
          />
          {["å", "ä", "ö"].map((letter) => (
            <button type="button" key={letter} className="letter" onClick={() => setInput((v) => v + letter)}>
              {letter}
            </button>
          ))}
          {canRecognizeSpeech() ? (
            <button type="button" className={`icon-button mic ${listening ? "is-live" : ""}`} aria-label="Säg det (say it)" onClick={() => void dictate()}>
              <Mic size={18} />
            </button>
          ) : null}
          <button type="submit" className="icon-button send" disabled={busy || !input.trim()} aria-label="Skicka (send)">
            <Send size={18} />
          </button>
        </form>
      )}
      {failed ? (
        <p className="lesson-error" role="alert">
          <SvLine line={ui.error} />
        </p>
      ) : null}
      {!done ? (
        <button className="btn btn-quiet chat-leave" onClick={onClose}>
          <SvLine line={ui.bye} />
        </button>
      ) : null}
    </div>
  );
}
