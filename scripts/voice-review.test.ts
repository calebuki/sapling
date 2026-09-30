import assert from "node:assert/strict";
import test from "node:test";
import { loadIsland } from "../src/content/islands.ts";
import { supportedLanguageCodes } from "../src/lib/learning/languages.ts";
import { collectLines } from "../src/lib/speech/catalog.ts";
import {
  compareLines,
  defaultFilters,
  filtersFromQuery,
  filtersToQuery,
  fold,
  matches,
  sourceKind,
  type VoiceLine,
} from "../src/lib/voice-review/filters.ts";

const line = (over: Partial<VoiceLine>): VoiceLine => ({
  id: "1",
  path: "vi/Kore/normal/x.mp3",
  language_code: "vi",
  voice: "Kore",
  slow: false,
  text: "Tôi không biết",
  en: "I don't know.",
  word_count: 3,
  speaker: "Lan",
  sources: ["lan scene cue"],
  units: ["xin-chao"],
  level: "A1",
  in_catalog: true,
  has_audio: true,
  provider: "gemini",
  take: 1,
  status: "unreviewed",
  note: null,
  reviewed_by: null,
  reviewed_at: null,
  audio_updated_at: null,
  created_at: "2026-09-30T00:00:00Z",
  updated_at: "2026-09-30T00:00:00Z",
  ...over,
});

test("every island's lines are unique, placed in a unit and levelled", async () => {
  for (const code of supportedLanguageCodes) {
    const island = await loadIsland(code);
    if (!island) continue;
    const lines = collectLines(island);
    assert.ok(lines.length > 0, code);
    const keys = new Set(lines.map((l) => `${l.voice}|${l.slow}|${l.text}`));
    assert.equal(keys.size, lines.length, `${code} has duplicate lines`);
    for (const l of lines) {
      assert.ok(l.sources.length > 0);
      assert.ok(l.speaker, `${code} "${l.text}" has no speaker`);
      if (l.units.length) assert.ok(l.level, `${code} "${l.text}" has a unit but no level`);
    }
    // Lesson phrases always belong to a unit.
    for (const l of lines.filter((l) => l.sources.includes("lesson phrase"))) assert.ok(l.level, `${code} lesson "${l.text}"`);
  }
});

test("search ignores case and accents", () => {
  assert.equal(fold("Tôi KHÔNG biết"), "toi khong biet");
  assert.equal(fold("Đây là"), "day la");
  assert.equal(fold("Groß"), "gross");
  const f = { ...defaultFilters, q: "toi biet" };
  assert.ok(matches(line({}), f));
  assert.ok(!matches(line({}), { ...f, q: "cảm" }));
});

test("filters narrow by language, level, status, words and source kind", () => {
  const l = line({});
  assert.ok(matches(l, { ...defaultFilters, languages: ["vi"], levels: ["A1"], statuses: ["unreviewed"] }));
  assert.ok(!matches(l, { ...defaultFilters, levels: ["A2"] }));
  assert.ok(matches(line({ level: null }), { ...defaultFilters, levels: ["none"] }));
  assert.ok(!matches(l, { ...defaultFilters, minWords: 4 }));
  assert.ok(matches(l, { ...defaultFilters, maxWords: 3 }));
  assert.ok(matches(l, { ...defaultFilters, source: "scene cue" }));
  assert.equal(sourceKind("anna dialogue"), "dialogue");
});

test("filters survive the URL", () => {
  const f = { ...defaultFilters, q: "hej", languages: ["sv", "de"], levels: ["A2"], statuses: ["rejected" as const], minWords: 2, sort: "length" as const, dir: "desc" as const };
  const query = Object.fromEntries(filtersToQuery(f));
  assert.deepEqual(filtersFromQuery(query), f);
  assert.equal(filtersToQuery(defaultFilters).toString(), "");
});

test("sorting by words breaks ties alphabetically", () => {
  const rows = [line({ text: "b", word_count: 2 }), line({ text: "a", word_count: 2 }), line({ text: "c", word_count: 1 })];
  assert.deepEqual(rows.sort((a, b) => compareLines(a, b, "words", "asc")).map((r) => r.text), ["c", "a", "b"]);
  assert.deepEqual(rows.sort((a, b) => compareLines(a, b, "words", "desc")).map((r) => r.text), ["a", "b", "c"]);
});
