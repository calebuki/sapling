import { generateSpeech } from "ai";
import { z } from "zod";

import { speechModel } from "@/lib/ai-models";
import { hasSupabase } from "@/lib/env";
import { isSpeechVoiceKey, speechVoices } from "@/lib/game/speech-voices";
import { createClient } from "@/lib/supabase/server";

// Natural neural Swedish for every spoken line. Responses depend only on the
// query string, so the CDN keeps each line after the first request and
// villagers answer instantly from then on.

const inputSchema = z.object({
  t: z.string().trim().min(1).max(400),
  v: z.string().refine(isSpeechVoiceKey),
  s: z.enum(["0", "1"]).default("0"),
});

const everyday =
  "You are a native Swedish speaker from Stockholm chatting with a friend on a small island. Speak natural, relaxed, everyday rikssvenska with warm, lively intonation, natural rhythm and the usual Swedish pitch accent. Never sound like you are reading aloud.";
const slow =
  "You are a friendly native Swedish speaker from Stockholm helping a beginner. Speak slowly and clearly, pronouncing every word fully with natural Swedish intonation and pitch accent, like a patient teacher, not a robot.";

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

  const { t: text, v, s } = parsed.data;
  try {
    // Gemini 3.8 returns a complete WAV file, ready for the browser.
    const { audio } = await generateSpeech({
      model,
      text,
      voice: speechVoices[v as keyof typeof speechVoices],
      language: "sv",
      instructions: s === "1" ? slow : everyday,
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
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
