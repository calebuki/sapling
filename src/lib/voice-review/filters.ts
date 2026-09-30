import type { Database, VoiceLineStatus } from "@/types/database";

// What the voice review list shows and in which order. Kept free of React so
// the rules are easy to test, and every filter round-trips through the URL so
// a view can be shared ("all rejected A2 lines in Swedish, longest first").

export type VoiceLine = Database["public"]["Tables"]["voice_lines"]["Row"];
export type VoiceJob = Database["public"]["Tables"]["voice_line_jobs"]["Row"];

export const statuses: VoiceLineStatus[] = ["unreviewed", "approved", "rejected", "queued"];
export const levels = ["A1", "A2", "none"] as const;
export const sortKeys = ["words", "length", "text", "speaker", "updated"] as const;
export type SortKey = (typeof sortKeys)[number];

export type Filters = {
  q: string;
  languages: string[];
  levels: string[];
  statuses: VoiceLineStatus[];
  speaker: string;
  voice: string;
  source: string;
  unit: string;
  speed: "all" | "normal" | "slow";
  audio: "all" | "has" | "missing";
  catalog: "all" | "in" | "out";
  minWords: number | null;
  maxWords: number | null;
  sort: SortKey;
  dir: "asc" | "desc";
};

export const defaultFilters: Filters = {
  q: "",
  languages: [],
  levels: [],
  statuses: [],
  speaker: "",
  voice: "",
  source: "",
  unit: "",
  speed: "all",
  audio: "all",
  catalog: "all",
  minWords: null,
  maxWords: null,
  sort: "words",
  dir: "asc",
};

// "anna scene cue" and "erik scene cue" are the same kind of line.
export function sourceKind(source: string) {
  return source.replace(/^\S+ (scene|dialogue)/, "$1");
}

// Search ignores case and accents, so "toi" finds "tôi" and "gross" finds "groß".
const letters: Record<string, string> = { đ: "d", ß: "ss", ø: "o", æ: "ae", œ: "oe", ł: "l" };
export function fold(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đßøæœł]/g, (c) => letters[c] ?? c);
}

export function searchText(line: VoiceLine) {
  return fold([line.text, line.en, line.speaker, line.voice, ...line.sources, ...line.units, line.note].filter(Boolean).join(" \u0000 "));
}

export function matches(line: VoiceLine, f: Filters, haystack = searchText(line)) {
  if (f.languages.length && !f.languages.includes(line.language_code)) return false;
  if (f.levels.length && !f.levels.includes(line.level ?? "none")) return false;
  if (f.statuses.length && !f.statuses.includes(line.status)) return false;
  if (f.speaker && line.speaker !== f.speaker) return false;
  if (f.voice && line.voice !== f.voice) return false;
  if (f.source && !line.sources.some((s) => sourceKind(s) === f.source)) return false;
  if (f.unit && !line.units.includes(f.unit)) return false;
  if (f.speed !== "all" && line.slow !== (f.speed === "slow")) return false;
  if (f.audio !== "all" && line.has_audio !== (f.audio === "has")) return false;
  if (f.catalog !== "all" && line.in_catalog !== (f.catalog === "in")) return false;
  if (f.minWords !== null && line.word_count < f.minWords) return false;
  if (f.maxWords !== null && line.word_count > f.maxWords) return false;
  const terms = fold(f.q).split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export function compareLines(a: VoiceLine, b: VoiceLine, sort: SortKey, dir: "asc" | "desc") {
  const sign = dir === "asc" ? 1 : -1;
  const primary =
    sort === "words"
      ? a.word_count - b.word_count
      : sort === "length"
        ? a.text.length - b.text.length
        : sort === "speaker"
          ? collator.compare(a.speaker ?? "", b.speaker ?? "")
          : sort === "updated"
            ? a.updated_at.localeCompare(b.updated_at)
            : 0;
  // Ties read alphabetically, the same way round whichever direction the sort goes.
  return primary * sign || (sort === "text" ? sign : 1) * collator.compare(a.text, b.text) || a.voice.localeCompare(b.voice) || Number(a.slow) - Number(b.slow);
}

// ---------- URL ----------

type Query = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const list = (value: string | string[] | undefined) => one(value).split(",").filter(Boolean);
const count = (value: string | string[] | undefined) => {
  const n = Number.parseInt(one(value), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const oneOf = <T extends string>(options: readonly T[], value: string | string[] | undefined, fallback: T) =>
  (options as readonly string[]).includes(one(value)) ? (one(value) as T) : fallback;

export function filtersFromQuery(query: Query): Filters {
  return {
    q: one(query.q),
    languages: list(query.lang),
    levels: list(query.level).filter((l) => (levels as readonly string[]).includes(l)),
    statuses: list(query.status).filter((s): s is VoiceLineStatus => (statuses as string[]).includes(s)),
    speaker: one(query.speaker),
    voice: one(query.voice),
    source: one(query.source),
    unit: one(query.unit),
    speed: oneOf(["all", "normal", "slow"], query.speed, "all"),
    audio: oneOf(["all", "has", "missing"], query.audio, "all"),
    catalog: oneOf(["all", "in", "out"], query.catalog, "all"),
    minWords: count(query.min),
    maxWords: count(query.max),
    sort: oneOf(sortKeys, query.sort, "words"),
    dir: oneOf(["asc", "desc"], query.dir, "asc"),
  };
}

export function filtersToQuery(f: Filters) {
  const params = new URLSearchParams();
  const set = (key: string, value: string, fallback = "") => value !== fallback && params.set(key, value);
  set("q", f.q.trim());
  set("lang", f.languages.join(","));
  set("level", f.levels.join(","));
  set("status", f.statuses.join(","));
  set("speaker", f.speaker);
  set("voice", f.voice);
  set("source", f.source);
  set("unit", f.unit);
  set("speed", f.speed, "all");
  set("audio", f.audio, "all");
  set("catalog", f.catalog, "all");
  set("min", f.minWords === null ? "" : String(f.minWords));
  set("max", f.maxWords === null ? "" : String(f.maxWords));
  set("sort", f.sort, "words");
  set("dir", f.dir, "asc");
  return params;
}
