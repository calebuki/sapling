"use client";
import { useRef, useState } from "react";
import { ArrowRight, Check, Headphones, Lightbulb, Mic, RotateCcw, Sprout } from "lucide-react";
import { useLearningModel } from "./providers/learning-model-provider";
import { TargetAudioButton } from "./target-audio-button";
import { useUiSounds } from "./providers/ui-sound-provider";
import { chooseNextActivity, normalizeSwedish, type AdaptiveActivity, type SessionAttempt } from "@/lib/learning/adaptive";
import { LiveVoiceSession } from "./live-voice-session";
import "@/app/acquisition.css";

export function AdaptiveSession() {
  const model = useLearningModel();
  const { playSound } = useUiSounds();
  const [minutes, setMinutes] = useState(10);
  const [activity, setActivity] = useState<AdaptiveActivity | null>(null);
  const [attempts, setAttempts] = useState<SessionAttempt[]>([]);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [plays, setPlays] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [voice, setVoice] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const startedAt = useRef(0);
  const sessionStart = useRef(0);
  const attemptId = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const successful = attempts.filter(a => a.successful && !a.assisted && a.activity.mode !== "encounter");
  const next = chooseNextActivity({ languageCode: model.targetLanguage.code, concepts: model.concepts, states: model.states, attempts });

  function prepare(item: AdaptiveActivity | null) {
    if (!item) { setComplete(true); return; }
    setActivity(!audioEnabled && (item.mode === "listen" || item.mode === "dictation") ? { ...item, mode: "recall" } : item);
    setAnswer(""); setRevealed(false); setFeedback(null); setError(""); setPlays(0);
    startedAt.current = performance.now();
    attemptId.current = crypto.randomUUID();
    requestAnimationFrame(() => inputRef.current?.focus());
  }
  function start() {
    sessionStart.current = performance.now();
    setComplete(false); setAttempts([]);
    prepare(chooseNextActivity({ languageCode: model.targetLanguage.code, concepts: model.concepts, states: model.states }));
  }
  async function submit() {
    if (!activity || lock.current || feedback) return;
    lock.current = true; setBusy(true); setError("");
    const encounter = activity.mode === "encounter";
    const listening = activity.mode === "listen";
    const dictation = activity.mode === "dictation";
    const expected = listening ? activity.listening!.meaning : dictation ? activity.listening!.text : activity.exercise.expected;
    const assisted = revealed || encounter || (!listening && !dictation && plays > 0);
    let correct = normalizeSwedish(answer) === normalizeSwedish(expected);
    try {
      // Open prompts accept semantic alternatives through the existing constrained evaluator.
      if (!encounter && !listening && !dictation && !correct && activity.exercise.mode !== "repeat" && answer.trim()) {
        const response = await fetch("/api/learning/evaluate-answer", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ languageCode: model.targetLanguage.code, lessonId: activity.lessonId,
            exerciseId: activity.exercise.audioId, transcript: answer, alternatives: [] }) });
        if (response.ok) {
          const result = await response.json();
          correct = result.successful === true;
        }
      }
      await model.recordObservation({
        attemptId: attemptId.current, conceptId: activity.conceptId,
        dimension: encounter ? "exposure" : listening || dictation ? "recognitionAudio" : activity.mode === "transfer" ? "production" : "recall",
        successful: correct, assisted, latencyMs: encounter ? null : Math.round(performance.now() - startedAt.current),
        response: encounter ? "" : answer, expected,
        context: { activityId: activity.id, mode: activity.mode, reason: activity.reason, replayCount: Math.max(0, plays - 1),
          hintUsed: revealed, minutes, source: "adaptive-v3", modality: "text" },
      });
      setAttempts(current => [...current, { activity, successful: correct, assisted }]);
      setFeedback(encounter ? activity.exercise.note : correct ? assisted ? "That works. Try it again later without the hint." : "You got it." : `A natural answer: ${expected}`);
      if (correct && !assisted) playSound("correct");
    } catch (err) { setError(err instanceof Error ? err.message : "Your answer could not be saved. Try again."); }
    finally { lock.current = false; setBusy(false); }
  }
  function advance() {
    if (performance.now() - sessionStart.current >= minutes * 60000 || attempts.length >= minutes * 3 || !next) {
      setComplete(true); playSound("complete"); return;
    }
    prepare(next);
  }
  if (model.isLoading) return <p role="status">Preparing your Swedish...</p>;
  if (voice) return <LiveVoiceSession onContinue={() => setVoice(false)} />;
  if (complete) return <section className="acquisition">
    <p className="acquisition-kicker"><Sprout size={16} /> Your Swedish, a little stronger</p>
    <h2>{successful.length ? `${successful.length} independent answers.` : "A little more familiar."}</h2>
    <div className="acquisition-summary">
      <p><strong>{successful.filter(a => a.activity.mode === "listen" || a.activity.mode === "dictation").length}</strong> understood without text</p>
      <p><strong>{successful.filter(a => a.activity.reason === "due").length}</strong> older phrases retrieved</p>
      <p><strong>{successful.filter(a => a.activity.reason === "repair").length}</strong> recovered after a difficult attempt</p>
    </div>
    <div className="acquisition-actions">
      {next ? <button className="acquisition-primary" onClick={() => { setComplete(false); sessionStart.current = performance.now(); prepare(next); }}>
        <ArrowRight size={18} /> {next.reason === "repair" ? "Try that phrase without help" : next.reason === "listening-gap" ? "Try it by ear" : "One more challenge"}
      </button> : null}
      <button onClick={() => setVoice(true)}><Mic size={18} /> Say it with Elin</button>
    </div>
  </section>;
  if (!activity) return <section className="acquisition">
    <p className="acquisition-kicker"><Sprout size={16} /> Your next step</p>
    <h2>A little more Swedish.</h2>
    <p>{next?.reason === "listening-gap" ? "Bring familiar phrases into focus by ear." : next?.reason === "due" ? "Find out what stayed with you." : "Hear it. Try it. Make it yours."}</p>
    <fieldset className="acquisition-duration"><legend>Time for Swedish</legend>
      {[3, 10, 20, 45].map(value => <label key={value}><input type="radio" name="duration" checked={minutes === value} onChange={() => setMinutes(value)} />{value} min</label>)}
    </fieldset>
    <label className="acquisition-toggle"><input type="checkbox" checked={audioEnabled} onChange={e => setAudioEnabled(e.target.checked)} /><Headphones size={17} /> Include listening</label>
    <div className="acquisition-actions"><button className="acquisition-primary" disabled={!next} onClick={start}><ArrowRight size={18} /> Begin</button>
      <button onClick={() => setVoice(true)}><Mic size={18} /> Talk with Elin</button></div>
  </section>;
  const encounter = activity.mode === "encounter";
  const listening = activity.mode === "listen" || activity.mode === "dictation";
  const clipId = listening ? activity.listening!.audioId : activity.exercise.audioId;
  const expected = listening ? activity.listening!.text : activity.exercise.expected;
  const options = activity.listening?.options;
  const rotated = options ? [...options.slice(attempts.length % options.length), ...options.slice(0, attempts.length % options.length)] : [];
  return <section className="acquisition" aria-busy={busy}>
    <header className="acquisition-topline"><p className="acquisition-kicker">{listening ? <Headphones size={16} /> : <Sprout size={16} />}
      {encounter ? "Encounter" : activity.mode === "listen" ? "Listen & understand" : activity.mode === "dictation" ? "Listen & write" : activity.reason === "repair" ? "Try it again" : "Recall"}
    </p><button disabled={busy} onClick={() => setComplete(true)}>Finish</button></header>
    <h2 lang={encounter ? "sv" : undefined}>{encounter ? expected : listening ? activity.mode === "dictation" ? "What did you hear?" : "What does it mean?" : activity.exercise.prompt}</h2>
    {encounter ? <p>{activity.exercise.prompt}</p> : null}
    {audioEnabled ? <TargetAudioButton key={activity.id} clipId={clipId} languageName="Swedish" label={listening ? "Listen" : "Hear an example"}
      showSlowControl onPlay={() => { setPlays(p => p + 1); }} /> : null}
    {!encounter && !feedback ? <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      {activity.mode === "listen" ? <fieldset className="acquisition-options"><legend className="sr-only">Meaning</legend>{rotated.map(option =>
        <label key={option}><input type="radio" name="meaning" value={option} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}</fieldset>
        : <label className="acquisition-answer">Your Swedish<input ref={inputRef} autoComplete="off" spellCheck={false} lang="sv"
          value={answer} onChange={e => setAnswer(e.target.value)} /></label>}
      {revealed ? <p lang="sv">{expected}</p> : null}
      <div className="acquisition-actions"><button className="acquisition-primary" disabled={busy || !answer.trim() || (listening && plays === 0)} type="submit"><Check size={18} /> Check</button>
        <button type="button" disabled={busy} onClick={() => setRevealed(true)}><Lightbulb size={18} /> A hint</button>
        <button type="button" disabled={busy} onClick={() => void submit()}><RotateCcw size={18} /> Not sure</button></div>
    </form> : null}
    {encounter && !feedback ? <div className="acquisition-actions"><button className="acquisition-primary" disabled={busy} onClick={() => void submit()}><ArrowRight size={18} /> Continue</button></div> : null}
    {feedback ? <div className="acquisition-feedback" role="status"><p>{feedback}</p>
      {listening ? <p lang="sv">{expected}</p> : null}
      <div className="acquisition-actions"><button className="acquisition-primary" onClick={advance}><ArrowRight size={18} /> Continue</button>
        {attempts.length > 0 && attempts.length % 6 === 0 ? <button onClick={() => setVoice(true)}><Mic size={18} /> Say it instead</button> : null}</div></div> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}
