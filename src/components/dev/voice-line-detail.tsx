"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Check, Copy, History, ListPlus, LoaderCircle, Pause, Play, RotateCcw, Wand2, X } from "lucide-react";

import { previousTakePath, publicClipUrl } from "@/lib/speech/clips";
import { getTargetLanguage, isTargetLanguageCode } from "@/lib/learning/languages";
import type { VoiceJob, VoiceLine } from "@/lib/voice-review/filters";
import type { VoiceLineStatus } from "@/types/database";
import { button, Kbd, LevelPill, StatusPill } from "./voice-review-ui";

export type PlayerHandle = { toggle: () => void; replay: () => void };

type Props = {
  line: VoiceLine;
  jobs: VoiceJob[];
  userId: string;
  autoplay: boolean;
  rate: number;
  onRate: (rate: number) => void;
  onReview: (status: VoiceLineStatus) => void;
  onAsk: (status: "rejected" | "queued") => void;
  onClose: () => void;
  canGenerate: boolean;
  ref?: React.Ref<PlayerHandle>;
};

const rates = [0.75, 1, 1.25];

const clipUrl = (path: string, take: number) => {
  const url = publicClipUrl(path);
  // Each take is fetched fresh; the clip at this path changes when a line is remade.
  return url ? `${url}?take=${take}` : null;
};

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
}

export function VoiceLineDetail({ line, jobs, userId, autoplay, rate, onRate, onReview, onAsk, onClose, canGenerate, ref }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<"current" | "previous" | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = line.has_audio ? clipUrl(line.path, line.take) : null;
  const previous = line.take > 1 ? publicClipUrl(previousTakePath(line.path, line.take - 1)) : null;
  const openJob = jobs.find((j) => j.status === "queued" || j.status === "running");

  const play = (which: "current" | "previous") => {
    const el = audio.current;
    const src = which === "current" ? current : previous;
    if (!el || !src) return;
    if (el.dataset.which !== which) {
      el.src = src;
      el.dataset.which = which;
    }
    el.currentTime = 0;
    el.playbackRate = rate;
    void el.play().catch(() => setPlaying(null));
  };
  const toggle = () => {
    const el = audio.current;
    if (el && !el.paused) el.pause();
    else play("current");
  };

  useImperativeHandle(ref, () => ({ toggle, replay: () => play("current") }));

  // A new line (or a new take of it) starts from the top, playing if autoplay is on.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.pause();
    delete el.dataset.which;
    el.removeAttribute("src");
    setPlaying(null);
    setDuration(null);
    setAudioError(false);
    if (current) {
      el.src = current;
      el.dataset.which = "current";
      el.playbackRate = rate;
      if (autoplay) void el.play().catch(() => {});
    }
    // Rate changes apply below without restarting the clip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.id, current, autoplay]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);

  const language = isTargetLanguageCode(line.language_code) ? getTargetLanguage(line.language_code).name : line.language_code;
  const wordsPerSecond = duration ? line.word_count / duration : null;

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--edge)] bg-[var(--paper)] p-4 shadow-[var(--shadow)]">
      <audio
        ref={audio}
        preload="auto"
        onPlay={(e) => setPlaying((e.currentTarget.dataset.which as "current" | "previous") ?? "current")}
        onPause={() => setPlaying(null)}
        onEnded={() => setPlaying(null)}
        onLoadedMetadata={(e) => e.currentTarget.dataset.which === "current" && setDuration(e.currentTarget.duration)}
        onError={() => audio.current?.dataset.which === "current" && setAudioError(true)}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={line.status} />
          <LevelPill level={line.level} />
          <span className="text-xs font-bold text-[var(--ink-soft)]">
            {language} · {line.word_count} {line.word_count === 1 ? "word" : "words"}
            {line.slow ? " · slow" : ""}
          </span>
        </div>
        <button className="rounded-full p-1 text-[var(--ink-soft)] hover:bg-[var(--paper-2)] lg:hidden" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div>
        <p lang={line.language_code} className="font-[family-name:var(--font-display)] text-2xl leading-snug">
          {line.text}
        </p>
        {line.en && <p className="mt-1 text-sm text-[var(--ink-soft)]">{line.en}</p>}
      </div>

      {/* Listening */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`${button} border-[var(--blue)] bg-[var(--blue)] text-white`}
          disabled={!current || audioError}
          onClick={toggle}
        >
          {playing === "current" ? <Pause size={16} /> : <Play size={16} />}
          {playing === "current" ? "Pause" : `Play take ${line.take}`}
          <Kbd>space</Kbd>
        </button>
        {previous && (
          <button
            className={`${button} border-[var(--edge-dark)] bg-white`}
            onClick={() => (playing === "previous" ? audio.current?.pause() : play("previous"))}
          >
            <History size={15} />
            {playing === "previous" ? "Pause" : `Take ${line.take - 1}`}
          </button>
        )}
        <div className="ml-auto flex overflow-hidden rounded-lg border border-[var(--edge-dark)]">
          {rates.map((r) => (
            <button
              key={r}
              className={`px-2 py-1 text-xs font-bold ${r === rate ? "bg-[var(--ink)] text-white" : "bg-white"}`}
              onClick={() => onRate(r)}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>
      {!line.has_audio && (
        <p className="rounded-xl bg-[var(--paper-2)] px-3 py-2 text-sm">
          No clip yet. Generate one, then listen and review it here.
        </p>
      )}
      {audioError && <p className="rounded-xl bg-[#fbe2df] px-3 py-2 text-sm text-[var(--red-edge)]">The clip didn&apos;t load.</p>}
      {duration !== null && (
        <p className="-mt-2 text-xs text-[var(--ink-soft)]">
          {duration.toFixed(1)} s · {wordsPerSecond!.toFixed(1)} words/s · {line.provider === "openai" ? "OpenAI" : "Gemini"}
        </p>
      )}

      {/* Verdict, or making the first clip */}
      {!line.has_audio ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`${button} col-span-2 border-[var(--blue)] bg-[var(--blue)] text-white`}
            disabled={!canGenerate || Boolean(openJob)}
            title={canGenerate ? undefined : "No voice provider is configured on the server"}
            onClick={() => onAsk("queued")}
          >
            <Wand2 size={16} /> {openJob ? "In the queue" : "Generate"} <Kbd>G</Kbd>
          </button>
          {line.status !== "unreviewed" && (
            <button className={`${button} col-span-2 border-[var(--edge-dark)] bg-white`} onClick={() => onReview("unreviewed")}>
              <RotateCcw size={15} /> {openJob ? "Take out of the queue" : "Reset"} <Kbd>U</Kbd>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`${button} border-[var(--green-edge)] bg-[var(--green)] text-white`}
            disabled={!line.has_audio || line.status === "approved"}
            onClick={() => onReview("approved")}
          >
            <Check size={16} /> Approve <Kbd>A</Kbd>
          </button>
          <button className={`${button} border-[var(--red-edge)] bg-[var(--red)] text-white`} onClick={() => onAsk("rejected")}>
            <X size={16} /> Reject <Kbd>R</Kbd>
          </button>
          <button className={`${button} border-[var(--yellow-edge)] bg-[var(--yellow)]`} onClick={() => onAsk("queued")}>
            <ListPlus size={16} /> Queue <Kbd>Q</Kbd>
          </button>
          <button
            className={`${button} border-[var(--edge-dark)] bg-white`}
            disabled={line.status === "unreviewed"}
            onClick={() => onReview("unreviewed")}
          >
            <RotateCcw size={15} /> Reset <Kbd>U</Kbd>
          </button>
        </div>
      )}

      {openJob && (
        <p className="flex items-center gap-2 rounded-xl bg-[#fff1c7] px-3 py-2 text-sm">
          {openJob.status === "running" ? <LoaderCircle size={15} className="spin" /> : <ListPlus size={15} />}
          {openJob.status === "running" ? "Making" : "Waiting to make"} {line.has_audio ? `take ${line.take + 1}` : "the first clip"} with{" "}
          {openJob.provider === "openai" ? "OpenAI" : "Gemini"}
          {openJob.direction ? `: “${openJob.direction}”` : ""}
        </p>
      )}
      {line.note && (
        <p className="rounded-xl border border-[var(--edge)] bg-white px-3 py-2 text-sm">
          <span className="font-extrabold">Note: </span>
          {line.note}
        </p>
      )}

      {/* Where it comes from */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-[var(--ink-soft)]">Speaker</dt>
        <dd>
          {line.speaker ?? "—"} <span className="text-[var(--ink-soft)]">({line.voice})</span>
        </dd>
        <dt className="text-[var(--ink-soft)]">Heard in</dt>
        <dd>{line.sources.length ? line.sources.join(", ") : line.in_catalog ? "—" : "runtime only (AI reply or old content)"}</dd>
        {line.units.length > 0 && (
          <>
            <dt className="text-[var(--ink-soft)]">Units</dt>
            <dd>{line.units.join(", ")}</dd>
          </>
        )}
        {line.reviewed_at && (
          <>
            <dt className="text-[var(--ink-soft)]">Reviewed</dt>
            <dd>
              {when(line.reviewed_at)} by {line.reviewed_by === userId ? "you" : "another reviewer"}
            </dd>
          </>
        )}
        <dt className="text-[var(--ink-soft)]">Clip</dt>
        <dd className="flex min-w-0 items-center gap-1">
          <code className="truncate text-xs">{line.path}</code>
          <button
            className="shrink-0 rounded p-1 hover:bg-[var(--paper-2)]"
            aria-label="Copy clip path"
            onClick={() => {
              void navigator.clipboard?.writeText(line.path).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              });
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </dd>
      </dl>

      {jobs.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-extrabold">Remakes ({jobs.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {jobs.map((j) => (
              <li key={j.id} className="rounded-lg bg-white px-2 py-1">
                <span className="font-bold">{j.status}</span> · {j.provider} · {j.reason} · {when(j.created_at)}
                {j.direction && <span className="block text-[var(--ink-soft)]">“{j.direction}”</span>}
                {j.error && <span className="block text-[var(--red-edge)]">{j.error}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
