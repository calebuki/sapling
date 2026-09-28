import { APICallError, generateSpeech, RetryError } from "ai";
import { z } from "zod";

import { speechModel } from "@/lib/ai-models";
import { hasSupabase } from "@/lib/env";
import { isNeuralVoice } from "@/lib/game/voices";
import { supportedLanguageCodes, type TargetLanguageCode } from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/server";

// Natural neural speech for every spoken line. Responses depend only on the
// query string, so the CDN keeps each line after the first request and
// villagers answer instantly from then on.

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
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { l: language, t: text, v: voice, s } = parsed.data;
  try {
    // Gemini returns a complete WAV file, ready for the browser.
    const { audio } = await generateSpeech({
      model,
      text,
      voice,
      language,
      instructions: s === "1" ? direction[language].slow : direction[language].everyday,
      outputFormat: "wav",
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(20_000),
    });
    return new Response(new Uint8Array(audio.uint8Array), {
      headers: {
        "Content-Type": audio.mediaType || "audio/wav",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("speech generation failed", error);
    const status = refusedByProvider(error) ? 503 : 502;
    return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  }
}
