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
import { speechModel } from "../src/lib/ai-models";
import { isTargetLanguageCode, type TargetLanguageCode } from "../src/lib/learning/languages";
import { collectLines } from "../src/lib/speech/catalog";
import { clipPath, SPEECH_BUCKET } from "../src/lib/speech/clips";
import { speechDirection } from "../src/lib/speech/direction";
import { wavToMp3 } from "../src/lib/speech/mp3";

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

  const clips = collectLines(island, { withSlow }).map((c) => ({ ...c, source: c.sources[0] }));
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
