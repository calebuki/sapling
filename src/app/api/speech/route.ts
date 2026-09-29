import { after } from "next/server";
import { APICallError, generateSpeech, RetryError } from "ai";
import { z } from "zod";

import { speechModel } from "@/lib/ai-models";
import { hasSupabase } from "@/lib/env";
import { isNeuralVoice } from "@/lib/game/voices";
import { supportedLanguageCodes, type TargetLanguageCode } from "@/lib/learning/languages";
import { clipPath, publicClipUrl, SPEECH_BUCKET } from "@/lib/speech/clips";
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

const direction: Record<TargetLanguageCode, { everyday: string; slow: string }> = {
  sv: {
    everyday:
      "You are a native Swedish speaker from Stockholm chatting with a friend on a small island. Speak natural, relaxed, everyday rikssvenska with warm, lively intonation, natural rhythm and the usual Swedish pitch accent. Never sound like you are reading aloud.",
    slow: "You are a friendly native Swedish speaker from Stockholm helping a beginner. Speak slowly and clearly, pronouncing every word fully with natural Swedish intonation and pitch accent, like a patient teacher, not a robot.",
  },
  de: {
    everyday:
      "You are a native German speaker from the Black Forest in southern Germany chatting with a friend in your village. Speak natural, relaxed, everyday standard German (Hochdeutsch) with a warm, friendly southern lilt and natural rhythm, not a heavy dialect. Never sound like you are reading aloud.",
    slow: "You are a friendly native German speaker helping a beginner. Speak slowly and clearly in standard German, pronouncing every word and ending fully with natural intonation, like a patient teacher, not a robot.",
  },
  da: {
    everyday:
      "You are a native Danish speaker from Copenhagen chatting with a friend. Speak natural, relaxed, everyday Danish with warm intonation and natural rhythm. Never sound like you are reading aloud.",
    slow: "You are a friendly native Danish speaker helping a beginner. Speak slowly and clearly with natural Danish intonation, like a patient teacher, not a robot.",
  },
};

// The provider refusing us (bad key, no credits) won't fix itself on the next
// line, so tell the game to stop asking and use device voices instead.
function refusedByProvider(error: unknown) {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(cause) && [401, 402, 403].includes(cause.statusCode ?? 0);
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
      instructions: s === "1" ? direction[language].slow : direction[language].everyday,
      outputFormat: "wav",
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(20_000),
    });
    const mp3 = wavToMp3(audio.uint8Array);
    if (supabase && path) {
      after(async () => {
        const { error } = await supabase.storage
          .from(SPEECH_BUCKET)
          .upload(path, mp3, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: false });
        // Two players asking for a new line at once both make it; the first one is kept.
        if (error && !/exists|duplicate/i.test(error.message)) console.error("speech clip upload failed", path, error.message);
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
