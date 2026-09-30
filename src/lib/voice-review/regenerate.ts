import type { SupabaseClient } from "@supabase/supabase-js";
import { APICallError, generateSpeech, RetryError } from "ai";

import { speechModel } from "@/lib/ai-models";
import { genderOf } from "@/lib/game/voices";
import { getTargetLanguage, isTargetLanguageCode } from "@/lib/learning/languages";
import { previousTakePath, SPEECH_BUCKET } from "@/lib/speech/clips";
import { speechDirection } from "@/lib/speech/direction";
import { wavToMp3 } from "@/lib/speech/mp3";
import type { Database } from "@/types/database";

// Makes the next queued line: its first clip, or a new take that replaces the
// old one (kept under history/ to compare). Either way the line comes back as
// "unreviewed" so someone listens to it. Runs as the reviewer; the storage
// policies let reviewers replace clips.

type Job = Database["public"]["Functions"]["claim_voice_line_job"]["Returns"][number];

export type JobResult =
  | { state: "empty" }
  | { state: "done"; jobId: number; lineId: string; text: string; first: boolean }
  | { state: "failed"; jobId: number; lineId: string; text: string; error: string }
  // Put back in the queue: the provider is rate limiting (try again in
  // `retryIn` seconds) or refusing outright (retryIn null: stop).
  | { state: "paused"; jobId: number; text: string; error: string; retryIn: number | null };

// OpenAI has no voices of Gemini's names, so it matches the speaker's gender.
const openAiVoices = { woman: "coral", man: "ash" } as const;

async function withGemini(job: Job, language: Parameters<typeof speechDirection>[0]) {
  const model = speechModel();
  if (!model) throw Object.assign(new Error("Gemini isn't configured (GOOGLE_GENERATIVE_AI_API_KEY or AI Gateway)."), { statusCode: 401 });
  const { audio } = await generateSpeech({
    model,
    text: job.text,
    voice: job.voice,
    instructions: [speechDirection(language, job.slow), job.direction].filter(Boolean).join(" "),
    outputFormat: "wav",
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(45_000),
  });
  return wavToMp3(audio.uint8Array);
}

async function withOpenAi(job: Job, language: Parameters<typeof speechDirection>[0]) {
  const key = process.env.OPENAI_TTS_KEY?.trim() || process.env.OPENAI_LIVE_VOICE_KEY?.trim();
  if (!key) throw Object.assign(new Error("OpenAI isn't configured (OPENAI_TTS_KEY or OPENAI_LIVE_VOICE_KEY)."), { statusCode: 401 });
  const { name, accent } = getTargetLanguage(language);
  const pace = job.slow ? "slowly and clearly, like a patient teacher" : "at a natural, relaxed pace";
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
      voice: openAiVoices[genderOf(job.voice)],
      input: job.text,
      instructions: [`Speak natural ${name} with a native ${accent ? `${accent} ` : ""}accent, ${pace}.`, job.direction]
        .filter(Boolean)
        .join(" "),
      response_format: "mp3",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw Object.assign(new Error(`OpenAI ${response.status}: ${body.slice(0, 200)}`), { statusCode: response.status });
  }
  return new Uint8Array(await response.arrayBuffer());
}

// Whether the provider, not the line, is the problem, and when to try again.
function providerTrouble(error: unknown): { retryIn: number | null } | null {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  const status = APICallError.isInstance(cause) ? cause.statusCode : (cause as { statusCode?: number } | null)?.statusCode;
  const detail = `${cause instanceof Error ? cause.message : ""} ${APICallError.isInstance(cause) ? (cause.responseBody ?? "") : ""}`;
  if ([401, 402, 403].includes(status ?? 0)) return { retryIn: null };
  if (status === 429) return /per_day|PerDay|insufficient_quota/.test(detail) ? { retryIn: null } : { retryIn: 65 };
  return null;
}

export async function runNextJob(supabase: SupabaseClient<Database>): Promise<JobResult> {
  const { data, error: claimError } = await supabase.rpc("claim_voice_line_job");
  if (claimError) throw new Error(claimError.message);
  const job = data?.[0];
  if (!job) return { state: "empty" };

  try {
    if (!isTargetLanguageCode(job.language_code)) throw new Error(`Unknown language "${job.language_code}"`);
    const mp3 = job.provider === "openai" ? await withOpenAi(job, job.language_code) : await withGemini(job, job.language_code);
    const bucket = supabase.storage.from(SPEECH_BUCKET);
    if (job.has_audio) await bucket.copy(job.path, previousTakePath(job.path, job.take));
    const { error } = await bucket.upload(job.path, mp3, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: true });
    if (error) throw new Error(`upload: ${error.message}`);
    const { error: finishError } = await supabase.rpc("finish_voice_line_job", { p_job_id: job.job_id });
    if (finishError) throw new Error(`finish: ${finishError.message}`);
    return { state: "done", jobId: job.job_id, lineId: job.line_id, text: job.text, first: !job.has_audio };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const trouble = providerTrouble(error);
    await supabase.rpc("finish_voice_line_job", { p_job_id: job.job_id, p_error: message, p_requeue: Boolean(trouble) });
    if (trouble) return { state: "paused", jobId: job.job_id, text: job.text, error: message, retryIn: trouble.retryIn };
    return { state: "failed", jobId: job.job_id, lineId: job.line_id, text: job.text, error: message };
  }
}
