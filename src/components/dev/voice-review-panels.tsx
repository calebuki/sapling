"use client";

import { useEffect, useRef, useState } from "react";
import { ListPlus, LoaderCircle, Play, RotateCw, Square, X } from "lucide-react";

import type { VoiceJob, VoiceLine } from "@/lib/voice-review/filters";
import type { VoiceProvider } from "@/types/database";
import { button, chip, chipOff, chipOn, field, Kbd, rejectReasons } from "./voice-review-ui";

// ---------- Reject / queue ----------

export type Verdict = { note: string; provider: VoiceProvider; direction: string };

type VerdictProps = {
  status: "rejected" | "queued";
  // Queueing lines that have no clip yet: their first one gets made.
  generate?: boolean;
  count: number;
  provider: VoiceProvider;
  onSubmit: (verdict: Verdict) => void;
  onCancel: () => void;
};

export function VerdictForm({ status, generate = false, count, provider: initialProvider, onSubmit, onCancel }: VerdictProps) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [provider, setProvider] = useState(initialProvider);
  const [direction, setDirection] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const rejecting = status === "rejected";

  useEffect(() => noteRef.current?.focus(), []);

  const submit = () => onSubmit({ note: [reasons.join(", "), note.trim()].filter(Boolean).join(": "), provider, direction });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(44,42,61,0.35)] p-4 sm:items-center" onClick={onCancel}>
      <form
        className="flex w-full max-w-md flex-col gap-3 rounded-[var(--radius)] border border-[var(--edge)] bg-[var(--paper)] p-4 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <header className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            {rejecting ? "Reject" : generate ? "Generate" : "Queue"} {count === 1 ? (generate ? "a clip" : "this line") : `${count.toLocaleString()} ${generate ? "clips" : "lines"}`}
          </h2>
          <button type="button" className="rounded-full p-1 hover:bg-[var(--paper-2)]" onClick={onCancel} aria-label="Cancel">
            <X size={18} />
          </button>
        </header>
        <p className="text-sm text-[var(--ink-soft)]">
          {rejecting
            ? "It goes to the queue and comes back for review once it has been made again."
            : generate
              ? `${count === 1 ? "It is" : "They are"} made in the order shown and come${count === 1 ? "s" : ""} back as unreviewed for you to listen to.`
              : "It will be made again and come back for review."}
        </p>

        {rejecting && (
          <div className="flex flex-wrap gap-1.5">
            {rejectReasons.map((r) => (
              <button
                key={r}
                type="button"
                className={`${chip} ${reasons.includes(r) ? chipOn : chipOff}`}
                onClick={() => setReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]))}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm font-bold">
          Note
          <textarea
            ref={noteRef}
            className={`${field} min-h-16`}
            maxLength={800}
            placeholder={rejecting ? "What's wrong? (“tone on mẹ sounds like mè”)" : "Why? (optional)"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-bold">Make it with</legend>
          <div className="flex gap-1.5">
            {(["gemini", "openai"] as const).map((p) => (
              <button key={p} type="button" className={`${chip} ${provider === p ? chipOn : chipOff}`} onClick={() => setProvider(p)}>
                {p === "gemini" ? "Gemini (same voice)" : "OpenAI (fallback voice)"}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm font-bold">
          Extra direction for the voice
          <input
            className={field}
            maxLength={400}
            placeholder="Optional: “say it warmly, stress the last word”"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          />
        </label>

        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-[var(--ink-soft)]">
            <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> to send
          </span>
          <button type="button" className={`${button} border-[var(--edge-dark)] bg-white`} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className={`${button} ${rejecting ? "border-[var(--red-edge)] bg-[var(--red)] text-white" : "border-[var(--yellow-edge)] bg-[var(--yellow)]"}`}
          >
            {rejecting ? "Reject → queue" : generate ? "Queue for generating" : "Add to queue"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- The queue ----------

// Each clip takes a few seconds to make, on top of the pause between them.
function roughly(seconds: number) {
  if (seconds < 90) return `${Math.round(seconds)} seconds`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} minutes`;
  return `${(seconds / 3600).toFixed(1)} hours`;
}

type QueueProps = {
  jobs: VoiceJob[];
  lines: Map<string, VoiceLine>;
  canGenerate: boolean;
  running: boolean;
  delay: number;
  log: string[];
  onDelay: (seconds: number) => void;
  onRun: () => void;
  onStop: () => void;
  onRetry: (ids: number[]) => void;
  onRemove: (lineId: string) => void;
  onSelect: (lineId: string) => void;
  onClose: () => void;
};

export function QueuePanel({ jobs, lines, canGenerate, running, delay, log, onDelay, onRun, onStop, onRetry, onRemove, onSelect, onClose }: QueueProps) {
  const open = jobs.filter((j) => j.status === "queued" || j.status === "running").sort((a, b) => a.created_at.localeCompare(b.created_at));
  // Only failures nothing has replaced yet.
  const waiting = new Set(open.map((j) => j.line_id));
  const failed = jobs.filter((j) => j.status === "failed" && !waiting.has(j.line_id));
  const failedLatest = [...new Map(failed.map((j) => [j.line_id, j])).values()];
  const done = jobs.filter((j) => j.status === "done").slice(0, 15);

  const row = (job: VoiceJob, extra?: React.ReactNode) => {
    const line = lines.get(job.line_id);
    return (
      <li key={job.id} className="flex items-start gap-2 rounded-lg bg-white px-2 py-1.5 text-sm">
        {job.status === "running" && <LoaderCircle size={14} className="spin mt-0.5 shrink-0" />}
        <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(job.line_id)}>
          <span className="block truncate">{line?.text ?? job.line_id}</span>
          <span className="block text-xs text-[var(--ink-soft)]">
            {line?.language_code} · {line?.voice} · {job.provider}
            {job.reason === "rejected" ? " · rejected" : job.reason === "generate" ? " · first clip" : ""}
          </span>
          {job.error && <span className="block text-xs text-[var(--red-edge)]">{job.error}</span>}
        </button>
        {extra}
      </li>
    );
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col gap-3 overflow-y-auto border-l border-[var(--edge)] bg-[var(--paper)] p-4 shadow-[var(--shadow)]">
      <header className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Queue</h2>
        <button className="rounded-full p-1 hover:bg-[var(--paper-2)]" onClick={onClose} aria-label="Close queue">
          <X size={18} />
        </button>
      </header>

      <div className="flex flex-col gap-2 rounded-xl border border-[var(--edge)] bg-white p-3">
        {canGenerate ? (
          <>
            <div className="flex items-center gap-2">
              {running ? (
                <button className={`${button} border-[var(--edge-dark)] bg-white`} onClick={onStop}>
                  <Square size={14} /> Stop
                </button>
              ) : (
                <button className={`${button} border-[var(--blue)] bg-[var(--blue)] text-white`} disabled={open.length === 0} onClick={onRun}>
                  <Play size={14} /> Run queue ({open.length})
                </button>
              )}
              <label className="ml-auto flex items-center gap-1 text-xs font-bold">
                every
                <input
                  className={`${field} w-14`}
                  type="number"
                  min={0}
                  max={120}
                  value={delay}
                  onChange={(e) => onDelay(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                />
                s
              </label>
            </div>
            {open.length > 1 && (
              <p className="text-xs font-bold">About {roughly(open.length * (delay + 4))} for {open.length.toLocaleString()} lines at this pace.</p>
            )}
            <p className="text-xs text-[var(--ink-soft)]">
              Runs while this tab stays open. Gemini allows about ten clips a minute, so keep a few seconds between them.
            </p>
          </>
        ) : (
          <p className="text-sm">
            No voice provider is configured on the server: add <code>GOOGLE_GENERATIVE_AI_API_KEY</code> (or an OpenAI key).
            Until then, lines wait here.
          </p>
        )}
        {log.length > 0 && (
          <ul className="max-h-28 overflow-y-auto font-mono text-[11px] text-[var(--ink-soft)]">
            {log.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        )}
      </div>

      <section>
        <h3 className="mb-1 text-sm font-extrabold">Waiting ({open.length})</h3>
        {open.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">Nothing waiting.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {open.map((job) =>
              row(
                job,
                job.status === "queued" && (
                  <button className="shrink-0 rounded p-1 hover:bg-[var(--paper-2)]" aria-label="Take out of the queue" onClick={() => onRemove(job.line_id)}>
                    <X size={14} />
                  </button>
                ),
              ),
            )}
          </ul>
        )}
      </section>

      {failedLatest.length > 0 && (
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[var(--red-edge)]">Failed ({failedLatest.length})</h3>
            <button className={`${button} border-[var(--edge-dark)] bg-white py-1 text-xs`} onClick={() => onRetry(failedLatest.map((j) => j.id))}>
              <RotateCw size={13} /> Retry all
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {failedLatest.map((job) =>
              row(
                job,
                <button className="shrink-0 rounded p-1 hover:bg-[var(--paper-2)]" aria-label="Retry" onClick={() => onRetry([job.id])}>
                  <RotateCw size={14} />
                </button>,
              ),
            )}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h3 className="mb-1 flex items-center gap-1 text-sm font-extrabold">
            <ListPlus size={14} /> Recently remade
          </h3>
          <ul className="flex flex-col gap-1">{done.map((job) => row(job))}</ul>
        </section>
      )}
    </aside>
  );
}
