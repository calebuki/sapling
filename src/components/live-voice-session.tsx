"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Radio, ArrowRight, LoaderCircle } from "lucide-react";
import { LiveVoiceTransport, type VoiceSnapshot } from "@/lib/voice/transport";
import { speakerCaption } from "@/lib/voice/transcript";
import { useLearningModel } from "./providers/learning-model-provider";
import { choosePracticeScenario } from "@/lib/practice/planner";

export function LiveVoiceSession({ onContinue }: { onContinue?: () => void }) {
  const model = useLearningModel();
  const recommendation = choosePracticeScenario({
    languageCode: "sv", concepts: model.concepts, states: model.states, snapshot: model.practiceSnapshot,
  });
  const audio = useRef<HTMLAudioElement>(null);
  const transport = useRef<LiveVoiceTransport | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [snapshot, setSnapshot] = useState<VoiceSnapshot | null>(null);
  const [muted, setMuted] = useState(false);
  const [summary, setSummary] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch("/api/voice/session").then(r => r.json()).then(r => { if (active) setAvailable(r.available); }).catch(() => { if (active) setAvailable(false); });
    const leave = () => transport.current?.dispose();
    const hidden = () => { if (document.hidden) transport.current?.close(); };
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", hidden);
    return () => { active = false; leave(); window.removeEventListener("pagehide", leave); document.removeEventListener("visibilitychange", hidden); };
  }, []);
  async function start() {
    if (!audio.current) return;
    const service = new LiveVoiceTransport(audio.current, setSnapshot);
    transport.current = service;
    await service.start(recommendation.scenario.id);
  }
  async function save() {
    if (!snapshot?.learningSessionId || saving || saved) return;
    setSaving(true); setSaveError("");
    try {
      const response = await fetch("/api/voice/finish", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: snapshot.learningSessionId, fragments: snapshot.fragments,
          seconds: snapshot.seconds, finalized: snapshot.finalized }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Conversation could not be saved.");
      setSummary(body.summary); setSaved(true);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Try saving again."); }
    finally { setSaving(false); }
  }
  const running = snapshot && ["connecting", "live", "closing"].includes(snapshot.status);
  return <section className="acquisition voice-session">
    <p className="acquisition-kicker"><Radio size={16} /> A moment with Elin</p>
    <h2>{recommendation.scenario.title}</h2>
    <p>{recommendation.scenario.goal}</p>
    {!snapshot ? <p className="acquisition-note">AI voice · Up to 3 minutes. OpenAI processes audio live; Sapling saves the transcript and learning feedback, not recordings. OpenAI API content may be retained for up to 30 days for abuse monitoring unless eligible retention controls are enabled.</p> : null}
    <audio ref={audio} autoPlay controls aria-label="Elin's voice playback" />
    <p role="status">{snapshot?.status === "live" ? muted ? "Microphone muted" : "Microphone on" :
      snapshot?.status === "connecting" ? "Connecting..." : snapshot?.status === "closing" ? "Finishing..." : ""}</p>
    {snapshot?.fragments.length ? <details open className="voice-captions">
      <summary>Captions</summary>
      <p lang="sv"><strong>Elin</strong> {speakerCaption(snapshot.fragments, "elin")}</p>
      <p lang="sv"><strong>You</strong> {speakerCaption(snapshot.fragments, "learner")}</p>
    </details> : null}
    {available === false ? <p>Live voice is not available yet. You can keep learning with audio and text.</p> : null}
    {snapshot?.error ? <p role="alert">{snapshot.error}</p> : null}
    <div className="acquisition-actions">
      {!snapshot && available ? <button className="acquisition-primary" onClick={() => void start()}><Mic size={18} /> Start conversation</button> : null}
      {snapshot?.status === "live" ? <>
        <button aria-pressed={muted} onClick={() => { setMuted(!muted); transport.current?.mute(!muted); }}>{muted ? <MicOff size={18} /> : <Mic size={18} />}{muted ? "Unmute" : "Mute"}</button>
        <button onClick={() => transport.current?.close()}><PhoneOff size={18} /> End conversation</button>
      </> : null}
      {snapshot && !running && snapshot.learningSessionId && !saved ? <button disabled={saving} onClick={() => void save()}>
        {saving ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />} {saving ? "Reflecting..." : snapshot.finalized ? "Save & reflect" : "Close incomplete session"}
      </button> : null}
      {!running && onContinue ? <button onClick={onContinue}><ArrowRight size={18} /> Continue learning</button> : null}
    </div>
    {summary ? <p role="status">{summary}</p> : null}
    {saveError ? <p role="alert">{saveError}</p> : null}
  </section>;
}
