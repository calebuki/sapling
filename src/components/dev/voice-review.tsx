"use client";

import { memo, useCallback, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Keyboard, ListOrdered, LoaderCircle, RefreshCw, Search, Sprout, Undo2, Wand2 } from "lucide-react";

import { getTargetLanguage, isTargetLanguageCode } from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/client";
import { allRows } from "@/lib/supabase/pages";
import {
  compareLines,
  defaultFilters,
  filtersFromQuery,
  filtersToQuery,
  levels,
  matches,
  searchText,
  sortKeys,
  sourceKind,
  statuses,
  type Filters,
  type SortKey,
  type VoiceJob,
  type VoiceLine,
} from "@/lib/voice-review/filters";
import type { VoiceLineStatus, VoiceProvider } from "@/types/database";
import { VoiceLineDetail, type PlayerHandle } from "./voice-line-detail";
import { QueuePanel, VerdictForm, type Verdict } from "./voice-review-panels";
import { button, chip, chipOff, chipOn, field, fieldOn, Kbd, LevelPill, statusLabel, StatusPill } from "./voice-review-ui";

// Every neural voice line the game says, straight from the database, to
// listen through and approve, reject (which queues a remake) or queue.

type Props = {
  initialQuery: Record<string, string | string[] | undefined>;
  userId: string;
  canGenerate: boolean;
};

type Prefs = { autoplay: boolean; advance: boolean; rate: number; provider: VoiceProvider; delay: number };
const defaultPrefs: Prefs = { autoplay: true, advance: true, rate: 1, provider: "gemini", delay: 7 };
const PREFS_KEY = "sapling:voice-review:prefs";
const PAGE = 150;

const sortNames: Record<SortKey, string> = { words: "Words", length: "Characters", text: "Text A–Z", speaker: "Speaker", updated: "Last changed" };
const verdictNames: Record<VoiceLineStatus, string> = { unreviewed: "Reset", approved: "Approved", rejected: "Rejected", queued: "Queued" };

function languageName(code: string) {
  return isTargetLanguageCode(code) ? getTargetLanguage(code).name : code;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function VoiceReview({ initialQuery, userId, canGenerate }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [lines, setLines] = useState<Map<string, VoiceLine>>(() => new Map());
  const [jobs, setJobs] = useState<Map<number, VoiceJob>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => filtersFromQuery(initialQuery));
  const shown = useDeferredValue(filters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  const [ask, setAsk] = useState<{ status: "rejected" | "queued"; ids: string[]; generate?: boolean } | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: boolean; bad?: boolean } | null>(null);
  const [undo, setUndo] = useState<Array<{ id: string; status: VoiceLineStatus }> | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const runningRef = useRef(false);
  const player = useRef<PlayerHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const keyboardMove = useRef(false);

  // ---------- Preferences (this browser only) ----------

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after hydration
      if (saved) setPrefs({ ...defaultPrefs, ...saved });
    } catch {}
  }, []);
  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // ---------- Filters live in the URL ----------

  useEffect(() => {
    const query = filtersToQuery(filters).toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters]);
  const patch = useCallback((change: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...change }));
    setLimit(PAGE);
  }, []);

  // ---------- Data ----------

  const load = useCallback(async () => {
    try {
      // Every waiting job (a big batch is thousands), and the latest finished ones.
      const [rows, waiting, finished] = await Promise.all([
        allRows<VoiceLine>((from, to) => supabase.from("voice_lines").select("*").order("id").range(from, to)),
        allRows<VoiceJob>((from, to) => supabase.from("voice_line_jobs").select("*").in("status", ["queued", "running"]).order("id").range(from, to)),
        supabase.from("voice_line_jobs").select("*").not("status", "in", "(queued,running)").order("id", { ascending: false }).limit(1000),
      ]);
      if (finished.error) throw finished.error;
      setLines(new Map(rows.map((r) => [r.id, r])));
      setJobs(new Map([...(finished.data ?? []), ...waiting].map((j) => [j.id, j])));
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount
    void load();
    const channel = supabase
      .channel("voice-review")
      .on<VoiceLine>("postgres_changes", { event: "*", schema: "public", table: "voice_lines" }, (payload) => {
        setLines((m) => {
          const next = new Map(m);
          if (payload.eventType === "DELETE") next.delete((payload.old as Partial<VoiceLine>).id!);
          else next.set(payload.new.id, payload.new);
          return next;
        });
      })
      .on<VoiceJob>("postgres_changes", { event: "*", schema: "public", table: "voice_line_jobs" }, (payload) => {
        setJobs((m) => {
          const next = new Map(m);
          if (payload.eventType === "DELETE") next.delete((payload.old as Partial<VoiceJob>).id!);
          else next.set(payload.new.id, payload.new);
          return next;
        });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  // ---------- What's shown ----------

  const haystacks = useMemo(() => new Map([...lines.values()].map((l) => [l.id, searchText(l)])), [lines]);

  const { visible, statusCounts, languageCounts } = useMemo(() => {
    const statusCounts: Record<VoiceLineStatus, number> = { unreviewed: 0, approved: 0, rejected: 0, queued: 0 };
    const languageCounts = new Map<string, { total: number; reviewed: number }>();
    const visible: VoiceLine[] = [];
    const anyStatus = { ...shown, statuses: [] };
    for (const line of lines.values()) {
      const lang = languageCounts.get(line.language_code) ?? { total: 0, reviewed: 0 };
      lang.total++;
      if (line.status === "approved") lang.reviewed++;
      languageCounts.set(line.language_code, lang);
      if (!matches(line, anyStatus, haystacks.get(line.id))) continue;
      statusCounts[line.status]++;
      if (!shown.statuses.length || shown.statuses.includes(line.status)) visible.push(line);
    }
    visible.sort((a, b) => compareLines(a, b, shown.sort, shown.dir));
    return { visible, statusCounts, languageCounts };
  }, [lines, haystacks, shown]);

  // Choices for the dropdowns, from the languages being looked at.
  const options = useMemo(() => {
    const speakers = new Set<string>();
    const voices = new Set<string>();
    const sources = new Set<string>();
    const units = new Set<string>();
    for (const line of lines.values()) {
      if (filters.languages.length && !filters.languages.includes(line.language_code)) continue;
      if (line.speaker) speakers.add(line.speaker);
      voices.add(line.voice);
      line.sources.forEach((s) => sources.add(sourceKind(s)));
      line.units.forEach((u) => units.add(u));
    }
    const sorted = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b));
    return { speakers: sorted(speakers), voices: sorted(voices), sources: sorted(sources), units: sorted(units) };
  }, [lines, filters.languages]);

  const jobsByLine = useMemo(() => {
    const byLine = new Map<string, VoiceJob[]>();
    for (const job of [...jobs.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      byLine.set(job.line_id, [...(byLine.get(job.line_id) ?? []), job]);
    }
    return byLine;
  }, [jobs]);
  const waitingLines = useMemo(
    () => new Set([...jobs.values()].filter((j) => j.status === "queued" || j.status === "running").map((j) => j.line_id)),
    [jobs],
  );
  const openJobs = waitingLines.size;
  // Lines in view with no clip that aren't waiting to be made, in the order shown.
  const missing = useMemo(() => visible.filter((l) => !l.has_audio && !waitingLines.has(l.id)).map((l) => l.id), [visible, waitingLines]);

  const selected = selectedId ? (lines.get(selectedId) ?? null) : null;
  const selectedIndex = selected ? visible.findIndex((l) => l.id === selected.id) : -1;

  const select = useCallback((id: string | null, byKeyboard = false) => {
    keyboardMove.current = byKeyboard;
    setSelectedId(id);
  }, []);

  // Keyboard moves keep the chosen row on screen, loading more rows if needed.
  useEffect(() => {
    if (!keyboardMove.current || !selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal the row the keyboard moved to
    if (selectedIndex >= limit) setLimit(selectedIndex + PAGE);
    requestAnimationFrame(() => document.getElementById(`line-${selectedId}`)?.scrollIntoView({ block: "nearest" }));
  }, [selectedId, selectedIndex, limit]);

  // More rows as the list is scrolled.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setLimit((n) => n + PAGE), { rootMargin: "600px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible.length]);

  // ---------- Verdicts ----------

  const flash = useCallback((text: string, extra: { undo?: boolean; bad?: boolean } = {}) => setToast({ text, ...extra }), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.undo ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const review = useCallback(
    async (ids: string[], status: VoiceLineStatus, verdict?: Verdict, { remember = true } = {}) => {
      if (!ids.length) return false;
      const before = ids.flatMap((id) => {
        const line = lines.get(id);
        return line ? [{ id, status: line.status }] : [];
      });
      setLines((m) => {
        const next = new Map(m);
        ids.forEach((id) => {
          const line = next.get(id);
          if (line) next.set(id, { ...line, status });
        });
        return next;
      });
      const { error } = await supabase.rpc("review_voice_lines", {
        p_ids: ids,
        p_status: status,
        p_note: verdict?.note || null,
        p_provider: verdict?.provider ?? prefs.provider,
        p_direction: verdict?.direction || null,
      });
      if (error) {
        setLines((m) => {
          const next = new Map(m);
          before.forEach(({ id, status: was }) => {
            const line = next.get(id);
            if (line) next.set(id, { ...line, status: was });
          });
          return next;
        });
        flash(`Couldn't save: ${error.message}`, { bad: true });
        return false;
      }
      if (remember) {
        setUndo(before);
        flash(`${verdictNames[status]} ${ids.length === 1 ? "1 line" : `${ids.length} lines`}`, { undo: true });
      }
      return true;
    },
    [lines, supabase, prefs.provider, flash],
  );

  const undoLast = useCallback(async () => {
    if (!undo) return;
    setUndo(null);
    const byStatus = new Map<VoiceLineStatus, string[]>();
    undo.forEach(({ id, status }) => byStatus.set(status, [...(byStatus.get(status) ?? []), id]));
    for (const [status, ids] of byStatus) await review(ids, status, undefined, { remember: false });
    flash("Undone");
  }, [undo, review, flash]);

  // After a verdict on the open line, the next one opens (and plays).
  const nextAfter = useCallback(
    (id: string) => {
      const i = visible.findIndex((l) => l.id === id);
      return i < 0 ? null : (visible[i + 1] ?? visible[i - 1] ?? null)?.id ?? null;
    },
    [visible],
  );

  const decide = useCallback(
    async (ids: string[], status: VoiceLineStatus, verdict?: Verdict) => {
      const single = ids.length === 1 && ids[0] === selectedId;
      const next = single && prefs.advance ? nextAfter(ids[0]) : null;
      const ok = await review(ids, status, verdict);
      if (!ok) return;
      if (!single) setChecked(new Set());
      if (next) select(next, true);
    },
    [selectedId, prefs.advance, nextAfter, review, select],
  );

  const targets = useCallback(() => (checked.size ? [...checked] : selectedId ? [selectedId] : []), [checked, selectedId]);

  // ---------- Sync and queue ----------

  async function sync() {
    setSyncing(true);
    try {
      const response = await fetch("/api/dev/voices/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters.languages.length ? { languages: filters.languages } : {}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? `sync failed (${response.status})`);
      const results = body.results as Array<{ language: string; lines: number; added: number; changed: number; dropped: number; audio: number }>;
      await load();
      flash(results.map((r) => `${r.language}: ${r.lines} lines, ${r.added} new, ${r.changed} changed, ${r.dropped} dropped`).join(" · ") || "Nothing to sync");
    } catch (error) {
      flash(error instanceof Error ? error.message : String(error), { bad: true });
    } finally {
      setSyncing(false);
    }
  }

  const note = (entry: string) => setRunLog((log) => [`${new Date().toLocaleTimeString()} ${entry}`, ...log].slice(0, 60));

  async function runQueue() {
    runningRef.current = true;
    setRunning(true);
    note("started");
    let pausedInARow = 0;
    while (runningRef.current) {
      const response = await fetch("/api/dev/voices/run", { method: "POST" }).catch(() => null);
      const body = response ? await response.json().catch(() => ({})) : {};
      if (!response?.ok) {
        note(`stopped: ${body.error ?? response?.status ?? "network error"}`);
        break;
      }
      if (body.state === "empty") {
        note("queue is empty");
        break;
      }
      let wait = prefs.delay;
      if (body.state === "done") {
        pausedInARow = 0;
        note(`✓ ${body.first ? "made" : "remade"} ${body.text}`);
      }
      if (body.state === "failed") note(`✗ ${body.text}: ${body.error}`);
      if (body.state === "paused") {
        // The provider, not the line: it stays in the queue.
        if (body.retryIn === null || ++pausedInARow > 5) {
          note(`stopped, the provider refused: ${body.error}`);
          break;
        }
        wait = body.retryIn * pausedInARow;
        note(`rate limited, waiting ${wait}s…`);
      }
      for (let waited = 0; waited < wait * 1000 && runningRef.current; waited += 250) await sleep(250);
    }
    runningRef.current = false;
    setRunning(false);
  }

  async function retry(ids: number[]) {
    const { data, error } = await supabase.rpc("retry_voice_line_jobs", { p_ids: ids });
    flash(error ? `Couldn't retry: ${error.message}` : `${data ?? 0} back in the queue`, { bad: Boolean(error) });
  }

  // ---------- Keyboard ----------

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
    if (ask) return;
    if (e.key === "Escape") {
      if (typing) target.blur();
      else if (showHelp) setShowHelp(false);
      else if (showQueue) setShowQueue(false);
      else if (checked.size) setChecked(new Set());
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const move = (by: number) => {
      e.preventDefault();
      if (!visible.length) return;
      const from = selectedIndex < 0 ? (by > 0 ? -1 : visible.length) : selectedIndex;
      const to = Math.max(0, Math.min(visible.length - 1, from + by));
      select(visible[to].id, true);
    };
    switch (e.key) {
      case "j":
      case "ArrowDown":
        return move(1);
      case "k":
      case "ArrowUp":
        return move(-1);
      case " ":
        e.preventDefault();
        return player.current?.toggle();
      case "/":
        e.preventDefault();
        return searchRef.current?.focus();
      case "?":
        return setShowHelp((s) => !s);
      case "z":
        return void undoLast();
      case "x":
        if (!selectedId) return;
        return setChecked((c) => {
          const next = new Set(c);
          if (next.has(selectedId)) next.delete(selectedId);
          else next.add(selectedId);
          return next;
        });
    }
    const ids = targets();
    if (!ids.length) return;
    // Nothing to reject or remake yet: their first clip gets made.
    const firstClips = ids.every((id) => !lines.get(id)?.has_audio);
    switch (e.key.toLowerCase()) {
      case "a":
        return void decide(
          ids.filter((id) => lines.get(id)?.has_audio),
          "approved",
        );
      case "r":
        e.preventDefault();
        return setAsk(firstClips ? { status: "queued", ids, generate: true } : { status: "rejected", ids });
      case "q":
        e.preventDefault();
        return setAsk({ status: "queued", ids, generate: firstClips });
      case "g": {
        const without = ids.filter((id) => !lines.get(id)?.has_audio);
        if (!without.length) return;
        e.preventDefault();
        return setAsk({ status: "queued", ids: without, generate: true });
      }
      case "u":
        return void decide(ids, "unreviewed");
    }
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // ---------- Render ----------

  const toggleIn = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const filtered = filtersToQuery({ ...filters, sort: defaultFilters.sort, dir: defaultFilters.dir }).toString() !== "";
  const reviewedShare = (lang: { total: number; reviewed: number }) => (lang.total ? Math.round((lang.reviewed / lang.total) * 100) : 0);
  const allChecked = visible.length > 0 && visible.every((l) => checked.has(l.id));

  return (
    <div className="min-h-dvh bg-[var(--paper-2)] text-[var(--ink)]">
      {/* Header */}
      <header className="border-b border-[var(--edge)] bg-[var(--paper)]">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-lg">
            <Sprout size={20} className="text-[var(--green)]" /> Voice review
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]" title={live ? "Changes from other reviewers appear as they happen" : "Not receiving live changes"}>
            <span className={`size-2 rounded-full ${live ? "bg-[var(--green)]" : "bg-[var(--edge-dark)]"}`} />
            {live ? "Live" : "Offline"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button className={`${button} border-[var(--edge-dark)] bg-white`} onClick={() => setShowHelp((s) => !s)} aria-label="Keyboard shortcuts">
              <Keyboard size={16} />
            </button>
            <button
              className={`${button} border-[var(--edge-dark)] bg-white`}
              disabled={syncing}
              title="Add lines the islands say now and check which have clips"
              onClick={() => void sync()}
            >
              {syncing ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />}
              Sync {filters.languages.length ? filters.languages.join(", ") : "all"}
            </button>
            <button className={`${button} border-[var(--yellow-edge)] bg-[var(--yellow)]`} onClick={() => setShowQueue((s) => !s)}>
              {running ? <LoaderCircle size={16} className="spin" /> : <ListOrdered size={16} />}
              Queue {openJobs > 0 && <span className="rounded-full bg-[var(--ink)] px-1.5 text-xs text-white">{openJobs}</span>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 px-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-60 flex-1">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input
                ref={searchRef}
                className={`${field} w-full py-1.5 pl-8`}
                placeholder="Search words, English, speaker, source, note…"
                value={filters.q}
                onChange={(e) => patch({ q: e.target.value })}
              />
              <span className="absolute top-1/2 right-2 -translate-y-1/2">
                <Kbd>/</Kbd>
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[...languageCounts.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([code, count]) => (
                  <button
                    key={code}
                    className={`${chip} ${filters.languages.includes(code) ? chipOn : chipOff}`}
                    onClick={() => patch({ languages: toggleIn(filters.languages, code), speaker: "", voice: "", unit: "" })}
                    title={`${count.reviewed} of ${count.total} approved`}
                  >
                    {languageName(code)} <span className="opacity-70">{reviewedShare(count)}%</span>
                  </button>
                ))}
            </div>
            <div className="flex gap-1.5">
              {levels.map((level) => (
                <button key={level} className={`${chip} ${filters.levels.includes(level) ? chipOn : chipOff}`} onClick={() => patch({ levels: toggleIn(filters.levels, level) })}>
                  {level === "none" ? "No level" : level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((status) => (
              <button
                key={status}
                className={`${chip} ${filters.statuses.includes(status) ? chipOn : chipOff}`}
                onClick={() => patch({ statuses: toggleIn(filters.statuses, status) })}
              >
                {statusLabel[status]} <span className="opacity-70">{statusCounts[status]}</span>
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-[var(--edge-dark)]" />
            <Select label="Speaker" value={filters.speaker} options={options.speakers} onChange={(speaker) => patch({ speaker })} />
            <Select label="Voice" value={filters.voice} options={options.voices} onChange={(voice) => patch({ voice })} />
            <Select label="Heard in" value={filters.source} options={options.sources} onChange={(source) => patch({ source })} />
            <Select label="Unit" value={filters.unit} options={options.units} onChange={(unit) => patch({ unit })} />
            <Select
              label="Speed"
              value={filters.speed === "all" ? "" : filters.speed}
              options={["normal", "slow"]}
              onChange={(speed) => patch({ speed: (speed || "all") as Filters["speed"] })}
            />
            <Select
              label="Clip"
              value={filters.audio === "all" ? "" : filters.audio}
              options={["has", "missing"]}
              names={{ has: "has a clip", missing: "no clip yet" }}
              onChange={(audio) => patch({ audio: (audio || "all") as Filters["audio"] })}
            />
            <Select
              label="Catalog"
              value={filters.catalog === "all" ? "" : filters.catalog}
              options={["in", "out"]}
              names={{ in: "in the course", out: "runtime / dropped" }}
              onChange={(catalog) => patch({ catalog: (catalog || "all") as Filters["catalog"] })}
            />
            <span className="flex items-center gap-1 text-xs font-bold">
              Words
              <input
                className={`${field} w-14`}
                type="number"
                min={0}
                placeholder="min"
                value={filters.minWords ?? ""}
                onChange={(e) => patch({ minWords: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
              />
              –
              <input
                className={`${field} w-14`}
                type="number"
                min={0}
                placeholder="max"
                value={filters.maxWords ?? ""}
                onChange={(e) => patch({ maxWords: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
              />
            </span>
            <span className="ml-auto flex items-center gap-1">
              <select className={field} value={filters.sort} onChange={(e) => patch({ sort: e.target.value as SortKey })} aria-label="Sort by">
                {sortKeys.map((key) => (
                  <option key={key} value={key}>
                    Sort: {sortNames[key]}
                  </option>
                ))}
              </select>
              <button
                className={`${button} border-[var(--edge-dark)] bg-white px-2`}
                onClick={() => patch({ dir: filters.dir === "asc" ? "desc" : "asc" })}
                aria-label={filters.dir === "asc" ? "Ascending" : "Descending"}
                title={filters.dir === "asc" ? "Fewest first" : "Most first"}
              >
                {filters.dir === "asc" ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
              </button>
              {filtered && (
                <button className="px-2 text-xs font-bold text-[var(--blue)] underline" onClick={() => patch({ ...defaultFilters, sort: filters.sort, dir: filters.dir })}>
                  Clear filters
                </button>
              )}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* The list */}
        <main className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--ink-soft)]">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => setChecked(allChecked ? new Set() : new Set(visible.map((l) => l.id)))}
                aria-label="Select every line shown"
              />
              {visible.length.toLocaleString()} {visible.length === 1 ? "line" : "lines"}
            </label>
            {missing.length > 0 && (
              <button
                className={`${button} border-[var(--blue)] bg-[var(--blue)] py-1 text-white`}
                disabled={!canGenerate}
                title={canGenerate ? "Queue a first clip for every line shown that has none, in this order" : "No voice provider is configured on the server"}
                onClick={() => setAsk({ status: "queued", ids: missing, generate: true })}
              >
                <Wand2 size={15} /> Generate {missing.length.toLocaleString()} missing
              </button>
            )}
            <span className="ml-auto flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={prefs.autoplay} onChange={(e) => updatePrefs({ autoplay: e.target.checked })} /> Autoplay
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={prefs.advance} onChange={(e) => updatePrefs({ advance: e.target.checked })} /> Next after verdict
              </label>
            </span>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 p-6 text-[var(--ink-soft)]">
              <LoaderCircle size={18} className="spin" /> Loading voice lines…
            </p>
          ) : loadError ? (
            <p className="rounded-xl bg-[#fbe2df] p-4 text-[var(--red-edge)]">Couldn&apos;t load voice lines: {loadError}</p>
          ) : lines.size === 0 ? (
            <div className="rounded-xl border border-[var(--edge)] bg-[var(--paper)] p-6">
              <p className="font-extrabold">No voice lines yet.</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Sync to list every line the islands say.</p>
              <button className={`${button} mt-3 border-[var(--blue)] bg-[var(--blue)] text-white`} disabled={syncing} onClick={() => void sync()}>
                {syncing ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />} Sync all islands
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="p-6 text-[var(--ink-soft)]">No lines match these filters.</p>
          ) : (
            <ul className="overflow-hidden rounded-xl border border-[var(--edge)] bg-[var(--paper)]">
              {visible.slice(0, limit).map((line) => (
                <Row
                  key={line.id}
                  line={line}
                  selected={line.id === selectedId}
                  checked={checked.has(line.id)}
                  job={jobsByLine.get(line.id)?.[0] ?? null}
                  showLanguage={filters.languages.length !== 1}
                  onSelect={select}
                  onCheck={setChecked}
                />
              ))}
            </ul>
          )}
          {visible.length > limit && <div ref={sentinel} className="h-10" />}
          {checked.size > 0 && (
            <div className="sticky bottom-2 z-20 mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-sm text-white">
              <span className="font-extrabold">{checked.size} selected</span>
              <button className={`${button} border-white/40 py-1`} onClick={() => void decide([...checked].filter((id) => lines.get(id)?.has_audio), "approved")}>
                Approve
              </button>
              <button className={`${button} border-white/40 py-1`} onClick={() => setAsk({ status: "rejected", ids: [...checked] })}>
                Reject…
              </button>
              <button className={`${button} border-white/40 py-1`} onClick={() => setAsk({ status: "queued", ids: [...checked] })}>
                Queue…
              </button>
              {[...checked].some((id) => !lines.get(id)?.has_audio) && (
                <button
                  className={`${button} border-white/40 py-1`}
                  onClick={() => setAsk({ status: "queued", ids: [...checked].filter((id) => !lines.get(id)?.has_audio), generate: true })}
                >
                  Generate…
                </button>
              )}
              <button className={`${button} border-white/40 py-1`} onClick={() => void decide([...checked], "unreviewed")}>
                Reset
              </button>
              <button className="ml-auto text-xs underline" onClick={() => setChecked(new Set())}>
                Clear
              </button>
            </div>
          )}

        </main>

        {/* The open line */}
        <div
          className={`${selected ? "fixed inset-x-0 bottom-0 z-30 max-h-[60dvh] overflow-y-auto p-2" : "hidden"} lg:sticky lg:top-4 lg:block lg:max-h-[calc(100dvh-32px)] lg:self-start lg:overflow-y-auto lg:p-0`}
        >
          {selected ? (
            <VoiceLineDetail
              ref={player}
              line={selected}
              jobs={jobsByLine.get(selected.id) ?? []}
              userId={userId}
              autoplay={prefs.autoplay}
              rate={prefs.rate}
              onRate={(rate) => updatePrefs({ rate })}
              onReview={(status) => void decide([selected.id], status)}
              onAsk={(status) => setAsk({ status, ids: [selected.id], generate: !selected.has_audio })}
              canGenerate={canGenerate}
              onClose={() => select(null)}
            />
          ) : (
            <div className="rounded-[var(--radius)] border border-dashed border-[var(--edge-dark)] p-6 text-sm text-[var(--ink-soft)]">
              Pick a line to listen to it. <Kbd>J</Kbd> <Kbd>K</Kbd> move, <Kbd>space</Kbd> plays, <Kbd>A</Kbd> approves, <Kbd>R</Kbd> rejects.
            </div>
          )}
        </div>
      </div>

      {ask && (
        <VerdictForm
          status={ask.status}
          generate={Boolean(ask.generate)}
          count={ask.ids.length}
          provider={prefs.provider}
          onCancel={() => setAsk(null)}
          onSubmit={(verdict) => {
            updatePrefs({ provider: verdict.provider });
            setAsk(null);
            // A big batch outruns realtime, so read the queue back once it's in.
            void decide(ask.ids, ask.status, verdict).then(() => (ask.ids.length > 50 ? load() : undefined));
            if (ask.generate && ask.ids.length > 1) setShowQueue(true);
          }}
        />
      )}

      {showQueue && (
        <QueuePanel
          jobs={[...jobs.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))}
          lines={lines}
          canGenerate={canGenerate}
          running={running}
          delay={prefs.delay}
          log={runLog}
          onDelay={(delay) => updatePrefs({ delay })}
          onRun={() => void runQueue()}
          onStop={() => {
            runningRef.current = false;
          }}
          onRetry={(ids) => void retry(ids)}
          onRemove={(lineId) => void review([lineId], "unreviewed")}
          onSelect={(lineId) => select(lineId, true)}
          onClose={() => setShowQueue(false)}
        />
      )}

      {showHelp && <Shortcuts onClose={() => setShowHelp(false)} />}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow)] ${toast.bad ? "bg-[var(--red-edge)]" : "bg-[var(--ink)]"}`}
        >
          <span>{toast.text}</span>
          {toast.undo && undo && (
            <button className="flex items-center gap-1 underline" onClick={() => void undoLast()}>
              <Undo2 size={14} /> Undo <Kbd>Z</Kbd>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Pieces ----------

function Select({
  label,
  value,
  options,
  names,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  names?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <select className={`${value ? fieldOn : field} max-w-44`} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}: any</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {label}: {names?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

const Row = memo(function Row({
  line,
  selected,
  checked,
  job,
  showLanguage,
  onSelect,
  onCheck,
}: {
  line: VoiceLine;
  selected: boolean;
  checked: boolean;
  job: VoiceJob | null;
  showLanguage: boolean;
  onSelect: (id: string) => void;
  onCheck: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const working = job && (job.status === "queued" || job.status === "running") ? job : null;
  const failed = job?.status === "failed" ? job : null;
  return (
    <li
      id={`line-${line.id}`}
      className={`grid cursor-pointer grid-cols-[auto_2.5rem_minmax(0,1fr)] items-start gap-x-3 border-b border-[var(--edge)] px-3 py-2 last:border-b-0 sm:grid-cols-[auto_2.5rem_minmax(0,1fr)_auto] ${
        selected ? "bg-[#fff1c7]" : checked ? "bg-[#f3ecdd]" : "hover:bg-white"
      } ${line.has_audio ? "" : "opacity-60"}`}
      onClick={() => onSelect(line.id)}
    >
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onClick={(e) => e.stopPropagation()}
        onChange={() =>
          onCheck((c) => {
            const next = new Set(c);
            if (next.has(line.id)) next.delete(line.id);
            else next.add(line.id);
            return next;
          })
        }
        aria-label="Select line"
      />
      <span className="text-center font-[family-name:var(--font-display)] text-xl leading-7 text-[var(--ink-soft)]" title="Words">
        {line.word_count}
      </span>
      <div className="min-w-0">
        <p lang={line.language_code} className="truncate text-[15px] font-bold">
          {line.text}
        </p>
        <p className="truncate text-xs text-[var(--ink-soft)]">
          {line.en ?? "—"}
          <span className="mx-1">·</span>
          {line.speaker ?? "?"} ({line.voice}){line.slow && " · slow"}
          {!line.has_audio && " · no clip yet"}
          {line.take > 1 && ` · take ${line.take}`}
        </p>
      </div>
      <div className="col-start-3 mt-1 flex flex-wrap items-center gap-1 sm:col-start-auto sm:mt-0 sm:justify-end">
        {showLanguage && <span className="text-[11px] font-extrabold text-[var(--ink-soft)] uppercase">{line.language_code}</span>}
        <LevelPill level={line.level} />
        {working ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--yellow-edge)] bg-[#fff1c7] px-2 py-0.5 text-[11px] font-bold text-[#8a5d00]">
            {working.status === "running" && <LoaderCircle size={11} className="spin" />}
            {!line.has_audio ? (working.status === "running" ? "Generating" : "To generate") : line.status === "rejected" ? "Rejected → queue" : "In queue"}
          </span>
        ) : (
          <StatusPill status={line.status} />
        )}
        {failed && <span className="rounded-full bg-[var(--red)] px-1.5 text-[11px] font-bold text-white" title={failed.error ?? ""}>failed</span>}
      </div>
    </li>
  );
});

function Shortcuts({ onClose }: { onClose: () => void }) {
  const keys: Array<[string[], string]> = [
    [["J", "↓"], "Next line"],
    [["K", "↑"], "Previous line"],
    [["space"], "Play / pause"],
    [["A"], "Approve"],
    [["R"], "Reject (sends it to the queue)"],
    [["Q"], "Queue without rejecting"],
    [["G"], "Generate a clip for lines that have none"],
    [["U"], "Reset to unreviewed"],
    [["X"], "Select / unselect for bulk actions"],
    [["Z"], "Undo the last verdict"],
    [["/"], "Search"],
    [["Esc"], "Leave search, close panels, clear selection"],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,61,0.35)] p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--edge)] bg-[var(--paper)] p-4 shadow-[var(--shadow)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl">Keyboard</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {keys.map(([k, what]) => (
            <li key={what} className="flex items-center justify-between gap-3">
              <span>{what}</span>
              <span className="flex gap-1">
                {k.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--ink-soft)]">With lines selected, A, R, Q and U apply to all of them.</p>
      </div>
    </div>
  );
}
