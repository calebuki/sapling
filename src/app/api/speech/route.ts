import { after } from "next/server";
import { APICallError, generateSpeech, RetryError } from "ai";
import { z } from "zod";

import { speechModel } from "@/lib/ai-models";
import { hasSupabase } from "@/lib/env";
import { isNeuralVoice } from "@/lib/game/voices";
import { supportedLanguageCodes } from "@/lib/learning/languages";
import { CLIP_VERSION, clipPath, clipText, publicClipUrl, SPEECH_BUCKET } from "@/lib/speech/clips";
import { speechDirection } from "@/lib/speech/direction";
import { wavToMp3 } from "@/lib/speech/mp3";
import { createClient } from "@/lib/supabase/server";

// Natural neural speech for every spoken line, generated once ever: the game
// looks for a line in the public speech bucket first and only comes here when
// it isn't there yet. This route makes it with Gemini, stores the MP3 for
// every player after it, and returns it.

const inputSchema = z.object({
  l: z.enum(supportedLanguageCodes).default("sv"),
  t: z.string().trim().min(1).max(400),
  v: z.string().refine(isNeuralVoice),
  s: z.enum(["0", "1"]).default("0"),
});


// The provider refusing us (bad key, no credits, the day's quota spent) won't
// fix itself on the next line, so tell the game to stop asking and use its
// fallback voices instead. A per-minute limit will, so that one is left out.
function refusedByProvider(error: unknown) {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (!APICallError.isInstance(cause)) return false;
  if ([401, 402, 403].includes(cause.statusCode ?? 0)) return true;
  return cause.statusCode === 429 && /per_day|PerDay/.test(`${cause.message} ${cause.responseBody ?? ""}`);
}

export const maxDuration = 30;

export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response(null, { status: 403 });
  }
  const parsed = inputSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response(null, { status: 400 });
  const model = speechModel();
  if (!model) return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  const supabase = hasSupabase ? await createClient() : null;
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { l: language, t: text, v: voice, s } = parsed.data;
  const path = await clipPath({ language, voice, slow: s === "1", text });
  const stored = path ? publicClipUrl(path) : null;
  // Someone else may have made it since the game looked.
  if (stored && (await fetch(stored, { method: "HEAD" }).then((r) => r.ok, () => false))) {
    return Response.redirect(stored, 302);
  }

  try {
    // Gemini returns a complete WAV file, ready for the browser. It detects the
    // language from the text; the instructions set the accent.
    const { audio } = await generateSpeech({
      model,
      text,
      voice,
      instructions: speechDirection(language, s === "1"),
      outputFormat: "wav",
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(20_000),
    });
    const mp3 = await wavToMp3(audio.uint8Array);
    if (supabase && path) {
      after(async () => {
        const { error } = await supabase.storage
          .from(SPEECH_BUCKET)
          .upload(path, mp3, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: false });
        // Two players asking for a new line at once both make it; the first one is kept.
        if (error && !/exists|duplicate/i.test(error.message)) {
          console.error("speech clip upload failed", path, error.message);
          return;
        }
        // So the line shows up in voice review, even one only an AI reply says.
        const { error: recordError } = await supabase.rpc("record_speech_clip", {
          p_path: path,
          p_language_code: language,
          p_voice: voice,
          p_slow: s === "1",
          p_text: clipText(text),
          p_version: CLIP_VERSION,
        });
        if (recordError) console.error("speech clip record failed", path, recordError.message);
      });
    }
    return new Response(new Uint8Array(mp3), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("speech generation failed", error);
    const status = refusedByProvider(error) ? 503 : 502;
    return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  }
}
