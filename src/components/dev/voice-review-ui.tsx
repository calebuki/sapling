import type { VoiceLineStatus } from "@/types/database";

// Small shared pieces of the voice review screen.

export const statusLabel: Record<VoiceLineStatus, string> = {
  unreviewed: "Unreviewed",
  approved: "Approved",
  rejected: "Rejected → queue",
  queued: "In queue",
};

export const statusTone: Record<VoiceLineStatus, string> = {
  unreviewed: "bg-white text-[var(--ink-soft)] border-[var(--edge-dark)]",
  approved: "bg-[#dff3e6] text-[var(--green-edge)] border-[var(--green)]",
  rejected: "bg-[#fbe2df] text-[var(--red-edge)] border-[var(--red)]",
  queued: "bg-[#fff1c7] text-[#8a5d00] border-[var(--yellow-edge)]",
};

export const levelTone: Record<string, string> = {
  A1: "bg-[#dff3e6] text-[var(--green-edge)]",
  A2: "bg-[#dde9f8] text-[#285a9c]",
  none: "bg-[#eee8dc] text-[var(--ink-soft)]",
};

export function StatusPill({ status, className = "" }: { status: VoiceLineStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusTone[status]} ${className}`}>
      {statusLabel[status]}
    </span>
  );
}

export function LevelPill({ level }: { level: string | null }) {
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${levelTone[level ?? "none"]}`}>{level ?? "—"}</span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-[var(--edge-dark)] bg-white px-1 py-px font-mono text-[10px] font-bold text-[var(--ink-soft)]">
      {children}
    </kbd>
  );
}

// Why a take was rejected, one tap each; they land in the note.
export const rejectReasons = [
  "Mispronounced",
  "Wrong tone",
  "Wrong accent",
  "Unnatural intonation",
  "Too fast",
  "Too slow",
  "Robotic",
  "Cut off / noise",
  "Wrong voice",
  "Wrong words",
];

export const chip =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-40";
// Selected things are tinted, not inverted: dark text stays readable even where
// a global rule (button { color: inherit }) wins over a text colour utility.
export const selectedTone = "border-[var(--blue)] bg-[#dde9f8] text-[#1f4f8f]";
export const chipOn = selectedTone;
export const chipOff = "border-[var(--edge-dark)] bg-white text-[var(--ink)] hover:bg-[var(--paper-2)]";
export const button =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-40";
export const field = "rounded-lg border border-[var(--edge-dark)] bg-white px-2 py-1 text-sm font-semibold";
export const fieldOn = `rounded-lg border px-2 py-1 text-sm font-semibold ${selectedTone}`;
