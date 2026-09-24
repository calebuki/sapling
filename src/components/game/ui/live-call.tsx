"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { LiveVoiceTransport, type VoiceSnapshot } from "@/lib/voice/transport";
import { speakerCaption } from "@/lib/voice/transcript";
import { ui } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { sound } from "../audio/sfx";
import { stopSpeaking } from "../audio/speech";
import { emote, runtime } from "../store";
import { Sv, SvLine } from "./sv";

// A real spoken conversation with the villager through GPT-Live. Evidence is
// only written by the server after the call is finalized and evaluated.
export function LiveCall({ villager, onClose, onFallback }: { villager: Villager; onClose: () => void; onFallback: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const transport = useRef<LiveVoiceTransport | null>(null);
  const [snapshot, setSnapshot] = useState<VoiceSnapshot | null>(null);
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<{ summary: string; repairs: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const saved = useRef(false);
  const lastVillagerText = useRef({ length: 0, at: 0 });
  const [elapsed, setElapsed] = useState(0);
  const isLive = snapshot?.status === "live";

  useEffect(() => {
    if (!isLive) return;
    const started = performance.now();
    const timer = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 500);
    return () => window.clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    const leave = () => transport.current?.dispose();
    window.addEventListener("pagehide", leave);
    return () => {
      leave();
      window.removeEventListener("pagehide", leave);
      runtime.speaking = null;
    };
  }, []);

  // Animate the villager's mouth while their words are arriving.
  useEffect(() => {
    if (!snapshot) return;
    const text = speakerCaption(snapshot.fragments, "elin");
    if (text.length !== lastVillagerText.current.length) {
      lastVillagerText.current = { length: text.length, at: performance.now() };
      runtime.speaking = villager.id;
    }
    const timer = window.setTimeout(() => {
      if (performance.now() - lastVillagerText.current.at > 700 && runtime.speaking === villager.id) runtime.speaking = null;
    }, 800);
    return () => window.clearTimeout(timer);
  }, [snapshot, villager.id]);

  // Save as soon as the call ends so the player never has to remember to.
  function onTransportChange(next: VoiceSnapshot) {
    setSnapshot(next);
    if (!next.learningSessionId || saved.current) return;
    if (next.status !== "closed" && next.status !== "error") return;
    saved.current = true;
    finish(next);
  }

  function finish(snapshot: VoiceSnapshot) {
    setSaving(true);
    runtime.speaking = null;
    void fetch("/api/voice/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: snapshot.learningSessionId,
        fragments: snapshot.fragments,
        seconds: snapshot.seconds,
        finalized: snapshot.finalized,
      }),
    })
      .then((r) => r.json())
      .then((body) => {
        setResult({ summary: body.summary ?? "", repairs: body.repairs ?? [] });
        if (snapshot.finalized) {
          sound.play("levelup");
          emote(villager.id, "happy", 2000);
        }
      })
      .catch(() => setResult({ summary: "", repairs: [] }))
      .finally(() => setSaving(false));
  }

  async function start() {
    if (!audio.current) return;
    stopSpeaking();
    sound.play("ring");
    const service = new LiveVoiceTransport(audio.current, onTransportChange);
    transport.current = service;
    await service.start(villager.scenarioId);
  }

  const status = snapshot?.status ?? "idle";
  const villagerText = snapshot ? speakerCaption(snapshot.fragments, "elin") : "";
  const learnerText = snapshot ? speakerCaption(snapshot.fragments, "learner") : "";

  return (
    <div className="live-call">
      <audio ref={audio} autoPlay />
      {status === "idle" ? (
        <>
          <SvLine line={{ sv: `Ring ${villager.name} och prata på svenska!`, en: `Call ${villager.name} and talk in Swedish!` }} as="h3" />
          <p className="live-privacy">
            AI voice, up to 3 minutes. OpenAI processes audio live; Sapling saves the transcript and learning feedback, not
            recordings. OpenAI API content may be retained for up to 30 days for abuse monitoring.
          </p>
          <div className="dialogue-actions">
            <button className="btn btn-primary" onClick={() => void start()} autoFocus>
              <Phone size={18} /> <SvLine line={ui.talkForReal} />
            </button>
            <button className="btn btn-quiet" onClick={onClose}>
              <SvLine line={ui.back} />
            </button>
          </div>
        </>
      ) : null}

      {status === "connecting" || status === "live" || status === "closing" ? (
        <>
          <div className={`live-orb ${status === "live" ? (muted ? "is-muted" : "is-live") : "is-connecting"}`}>
            {status === "connecting" ? <LoaderCircle className="spin" size={28} /> : muted ? <MicOff size={28} /> : <Mic size={28} />}
          </div>
          <p className="live-status" role="status">
            <SvLine line={status === "connecting" ? ui.connecting : status === "closing" ? ui.saving : muted ? ui.mute : ui.liveNow} />
            {status === "live" ? <span className="live-timer">{formatSeconds(elapsed)} / 3:00</span> : null}
          </p>
          <div className="live-captions" aria-live="polite">
            {villagerText ? (
              <p>
                <strong>{villager.name}</strong> <Sv text={tail(villagerText)} />
              </p>
            ) : null}
            {learnerText ? (
              <p className="is-you">
                <strong>
                  <SvLine line={ui.youLabel} />
                </strong>{" "}
                <Sv text={tail(learnerText)} />
              </p>
            ) : null}
          </div>
          {status === "live" ? (
            <div className="dialogue-actions">
              <button
                className="btn"
                aria-pressed={muted}
                onClick={() => {
                  setMuted(!muted);
                  transport.current?.mute(!muted);
                }}
              >
                {muted ? <Mic size={18} /> : <MicOff size={18} />} <SvLine line={muted ? ui.unmute : ui.mute} />
              </button>
              <button className="btn btn-danger" onClick={() => transport.current?.close()}>
                <PhoneOff size={18} /> <SvLine line={ui.endCall} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {status === "closed" || status === "error" ? (
        <>
          <SvLine line={status === "error" && !snapshot?.learningSessionId ? ui.liveUnavailable : ui.liveOver} as="h3" />
          {snapshot?.error && !snapshot.learningSessionId ? <p className="live-privacy">{snapshot.error}</p> : null}
          {saving ? (
            <p role="status">
              <LoaderCircle className="spin" size={16} /> <SvLine line={ui.saving} />
            </p>
          ) : null}
          {result?.summary ? <p className="live-summary">{result.summary}</p> : null}
          {result?.repairs.length ? (
            <ul className="live-repairs">
              {result.repairs.map((r) => (
                <li key={r}>
                  <Sv text={r} />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="dialogue-actions">
            {status === "error" && !snapshot?.learningSessionId ? (
              <button className="btn btn-primary" onClick={onFallback}>
                <SvLine line={ui.chatTyping} />
              </button>
            ) : null}
            <button className="btn" disabled={saving} onClick={onClose} autoFocus>
              <SvLine line={ui.back} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function tail(text: string) {
  return text.length > 220 ? "…" + text.slice(-220) : text;
}

function formatSeconds(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
