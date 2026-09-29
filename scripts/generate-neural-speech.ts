// Pre-generates an island's neural voice lines into the shared Supabase
// "speech" bucket, so players find them there instead of waiting on Gemini.
// It walks everything the game says aloud (dialogue, lessons, scenes, drills,
// the café, grammar tips), in the voice the game would use for it, skips what
// is already stored, and paces itself under the Gemini quota. Safe to stop and
// run again: it picks up where it left off.
//
//   npx tsx --env-file=.env.local scripts/generate-neural-speech.ts sv
//     --dry-run     list what would be generated, touch nothing
//     --slow        also make the slow versions of lesson phrases
//     --delay=7     seconds between Gemini requests (default 7)
//     --limit=100   stop after this many new clips
//
// Needs GOOGLE_GENERATIVE_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL and a Supabase
// secret key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) to write clips.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { APICallError, generateSpeech, RetryError } from "ai";

import { loadIsland } from "../src/content/islands";
import type { IslandPack } from "../src/content/types";
import { speechModel } from "../src/lib/ai-models";
import { expectedFor } from "../src/lib/game/lesson";
import type { Line } from "../src/lib/game/line";
import type { SceneBeat } from "../src/lib/game/scenes";
import type { Villager } from "../src/lib/game/villagers";
import { passerVoices, playerVoice } from "../src/lib/game/voices";
import { isTargetLanguageCode, type TargetLanguageCode } from "../src/lib/learning/languages";
import { clipPath, clipText, SPEECH_BUCKET } from "../src/lib/speech/clips";
import { speechDirection } from "../src/lib/speech/direction";
import { wavToMp3 } from "../src/lib/speech/mp3";

type Clip = { text: string; voice: string; slow: boolean; source: string; priority: number };
type Bucket = ReturnType<SupabaseClient["storage"]["from"]>;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: number) => {
  const value = args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  return value ? Number(value) : fallback;
};
const language = args.find((a) => !a.startsWith("--")) ?? "sv";
const dryRun = flag("dry-run");
const withSlow = flag("slow");
const delaySeconds = option("delay", 7);
const limit = option("limit", Infinity);

// ---------- What the game says, and in whose voice ----------

// Lines with the learner's own name differ per player, so they can't be made ahead.
const personal = (text: string) => /Caleb|\{name\}|\{n\}/.test(text);

function collect(island: IslandPack): Clip[] {
  const clips = new Map<string, Clip>();
  // Lines the neutral voice repeats (phrase book, replays) are heard least, so they go last.
  const add = (text: string | undefined, voice: string, source: string, slow = false) => {
    const t = text ? clipText(text) : "";
    if (!t || personal(t)) return;
    const key = `${voice}|${slow}|${t}`;
    const priority = (slow ? 2 : 0) + (voice === passerVoices.woman && !/where|customer|scene|café cue|café reaction/.test(source) ? 1 : 0);
    if (!clips.has(key)) clips.set(key, { text: t, voice, slow, source, priority });
  };
  const addLines = (lines: Line[] | undefined, voice: string, source: string) => lines?.forEach((l) => add(l.t, voice, source));

  const villagers = new Map(island.villagers.map((v) => [v.id, v]));
  const byName = new Map(island.villagers.map((v) => [v.name, v]));
  const extras = island.sceneExtras;
  const neutral = passerVoices.woman;
  const teacherOf = (slug: string) => {
    const unit = island.course.units.find((u) => u.slugs.includes(slug));
    return unit ? villagers.get(unit.villager) : undefined;
  };
  // Same rules as voiceOf in scene-round.tsx.
  const voiceOf = (name: string | undefined, villager: Villager, pitch?: number) => {
    const other = name ? byName.get(name) : undefined;
    if (other) return other.voice;
    const gender = (name ? extras.speakers[name] : undefined) ?? ((pitch ?? villager.voicePitch) < 1 ? "man" : "woman");
    return passerVoices[gender];
  };
  const beatVoice = (beat: SceneBeat, villager: Villager) => voiceOf(beat.speaker === "?" ? beat.guest : beat.speaker, villager, beat.pitch);
  const addBeat = (beat: SceneBeat, villager: Villager, source: string) => {
    const voice = beatVoice(beat, villager);
    add(beat.cue.t, voice, `${source} cue`);
    add(beat.reaction.t, voice, `${source} reaction`);
    beat.branches?.forEach((b) => add(b.reaction.t, voice, `${source} reaction`));
    if (beat.expect) {
      // Said back by the villager in feedback, and by the neutral voice on "you can say".
      add(beat.expect.t, villager.voice, `${source} answer`);
      add(beat.expect.t, neutral, `${source} answer`);
    }
  };

  // Dialogue.
  const host = villagers.get(island.host);
  if (host) addLines(island.script.intro, host.voice, "intro");
  for (const v of island.villagers) {
    addLines([...v.greetings, ...v.chatter, v.locked, v.teach, v.talk, ...v.goodbye], v.voice, `${v.id} dialogue`);
  }

  // Lesson phrases: the teacher says them, the phrase book and replays use the neutral voice.
  for (const lesson of island.course.lessons) {
    for (const exercise of lesson.exercises) {
      const teacher = teacherOf(exercise.conceptSlug);
      const text = expectedFor(exercise, null);
      if (teacher) add(text, teacher.voice, "lesson phrase");
      add(text, neutral, "lesson phrase");
      if (withSlow) {
        if (teacher) add(text, teacher.voice, "lesson phrase (slow)", true);
        add(text, neutral, "lesson phrase (slow)", true);
      }
    }
  }

  // Listening items, and introductions in the voice of whoever introduces themselves.
  for (const item of island.course.listenSpeakItems) {
    const teacher = teacherOf(item.conceptSlug);
    if (!teacher) continue;
    add(item.text, teacher.voice, "listening");
    const name = extras.guestNames.find((n) => item.text.includes(n));
    if (name) add(item.text, voiceOf(name, teacher), "introduction");
  }

  // Scenes.
  for (const [villagerId, bySlug] of Object.entries(island.scenes)) {
    const villager = villagers.get(villagerId);
    if (!villager) continue;
    for (const beats of Object.values(bySlug)) beats.forEach((beat) => addBeat(beat, villager, `${villagerId} scene`));
  }

  // Drills.
  extras.whereQuestions.forEach((q) => add(q.t, passerVoices.woman, "where question"));
  extras.announcements.forEach((a) => add(a.t, passerVoices.man, "announcement"));
  for (const [slug, sentences] of Object.entries(extras.whenSentences)) {
    const teacher = teacherOf(slug);
    if (teacher) sentences.forEach((s) => add(s.t, teacher.voice, "when sentence"));
  }

  // The café.
  const cafe = island.cafe;
  const barista = island.villagers.find((v) => v.round === "cafe");
  if (cafe && barista) {
    for (const item of cafe.menu) {
      for (const line of [cafe.introduce(item), cafe.price(item), cafe.serve(item), cafe.checkOrder(item)]) add(line.t, barista.voice, "café");
    }
    addLines(Object.values(cafe.lines), barista.voice, "café");
    for (const variants of Object.values(cafe.orderVariants)) {
      variants.forEach((o) => {
        add(o.t, barista.voice, "café order");
        add(o.t, neutral, "café order");
      });
    }
    cafe.trayOrders.forEach((o) => add(o.t, passerVoices.woman, "café customer"));
    addBeat(cafe.orderExchange, barista, "café");
    addBeat(cafe.billExchange, barista, "café");
  }

  // Grammar tips, read out by whoever teaches the unit.
  for (const tip of island.grammar) {
    const unit = island.course.units.find((u) => u.id === tip.unit);
    const teacher = unit ? villagers.get(unit.villager) : undefined;
    if (!teacher) continue;
    tip.cards.forEach((card) => card.examples.forEach((e) => add(e.t.replace("→", ","), teacher.voice, "grammar")));
    add(tip.check.answer, teacher.voice, "grammar");
  }

  // Things you find: you say them, the phrase book repeats them.
  island.discoveries.forEach((d) => {
    add(d.t, playerVoice, "discovery");
    add(d.t, neutral, "discovery");
  });

  return [...clips.values()].sort((a, b) => a.priority - b.priority);
}

// ---------- Storage ----------

async function storedPaths(bucket: Bucket, prefix: string) {
  const found = new Set<string>();
  const { data: voices } = await bucket.list(prefix, { limit: 1000 });
  for (const voice of voices ?? []) {
    for (const speed of ["normal", "slow"]) {
      const folder = `${prefix}/${voice.name}/${speed}`;
      for (let offset = 0; ; offset += 1000) {
        const { data } = await bucket.list(folder, { limit: 1000, offset });
        data?.forEach((f) => found.add(`${folder}/${f.name}`));
        if (!data || data.length < 1000) break;
      }
    }
  }
  return found;
}

// ---------- Generating ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function statusOf(error: unknown) {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(cause) ? cause.statusCode : undefined;
}

async function main() {
  if (!isTargetLanguageCode(language)) throw new Error(`Unknown language "${language}"`);
  const code: TargetLanguageCode = language;
  const island = await loadIsland(code);
  if (!island) throw new Error(`No island for "${code}"`);

  const clips = collect(island);
  const withPaths = await Promise.all(clips.map(async (c) => ({ ...c, path: (await clipPath({ language: code, ...c }))! })));
  const bySource: Record<string, number> = {};
  for (const c of withPaths) {
    const kind = c.source.replace(/^\S+ (scene|dialogue)/, "$1");
    bySource[kind] = (bySource[kind] ?? 0) + 1;
  }
  console.log(`${withPaths.length} lines for ${code}:`, bySource);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const readKey = secret ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !readKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and a Supabase key are needed");
  const supabase = createClient(url, readKey, { auth: { persistSession: false } });
  const bucket = supabase.storage.from(SPEECH_BUCKET);
  const stored = await storedPaths(bucket, code);
  const todo = withPaths.filter((c) => !stored.has(c.path));
  console.log(`${withPaths.length - todo.length} already stored, ${todo.length} to generate.`);

  if (dryRun) {
    todo.slice(0, 40).forEach((c) => console.log(`  ${c.voice.padEnd(12)} ${c.slow ? "slow " : ""}${c.text}   (${c.source})`));
    if (todo.length > 40) console.log(`  … and ${todo.length - 40} more`);
    return;
  }
  if (!secret) throw new Error("Add SUPABASE_SECRET_KEY (Supabase dashboard → Project Settings → API keys) to .env.local to store clips.");
  const model = speechModel();
  if (!model) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is needed");

  let made = 0;
  let failed = 0;
  let refusedInARow = 0;
  const started = Date.now();
  for (const [i, clip] of todo.entries()) {
    if (made >= limit) break;
    const label = `[${i + 1}/${todo.length}] ${clip.voice} ${clip.slow ? "(slow) " : ""}"${clip.text}"`;
    try {
      const { audio } = await generateSpeech({
        model,
        text: clip.text,
        voice: clip.voice,
        instructions: speechDirection(code, clip.slow),
        outputFormat: "wav",
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(90_000),
      });
      const mp3 = await wavToMp3(audio.uint8Array);
      const { error } = await bucket.upload(clip.path, mp3, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: false });
      if (error && !/exists|duplicate/i.test(error.message)) throw new Error(`upload: ${error.message}`);
      made++;
      refusedInARow = 0;
      console.log(`${label} ✓ ${Math.round(mp3.length / 1024)} KB`);
    } catch (error) {
      const status = statusOf(error);
      if (status === 429) {
        refusedInARow++;
        if (refusedInARow >= 6) {
          console.log(`\nGemini keeps refusing (quota). Made ${made} this run; run again later to continue.`);
          break;
        }
        const wait = 65 * refusedInARow;
        console.log(`${label} quota reached, waiting ${wait}s…`);
        await sleep(wait * 1000);
        todo.splice(i + 1, 0, clip); // try this one again
        continue;
      }
      if (status === 401 || status === 403) throw new Error("Gemini refused the API key.");
      failed++;
      console.log(`${label} ✗ ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(delaySeconds * 1000);
  }
  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\nDone in ${minutes} min: ${made} new clips, ${failed} failed, ${todo.length - made - failed} left.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
