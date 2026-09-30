import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { getTargetLanguage, supportedLanguageCodes } from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/server";

// OpenAI's neural speech, for lines Gemini can't speak right now (/api/speech
// is out of quota or down). Nothing is stored: these clips are a stand-in, and
// the line is made in its proper Gemini voice once Gemini is back.

const inputSchema = z.object({
  language: z.enum(supportedLanguageCodes).default("sv"),
  text: z.string().trim().min(1).max(400),
  voice: z.enum(["female", "male"]).default("female"),
});

type SpeechInput = z.infer<typeof inputSchema>;

export const maxDuration = 20;

const openAiVoices = { female: "coral", male: "ash" } as const;

// No key, a bad key or no credits won't fix itself on the next line, so the
// game is told (503) to stop asking; anything else (502) may pass.
async function synthesizeWithOpenAi({ language, text, voice }: SpeechInput): Promise<ArrayBuffer | 502 | 503> {
  const key = process.env.OPENAI_TTS_KEY?.trim() || process.env.OPENAI_LIVE_VOICE_KEY?.trim();
  if (!key) return 503;
  const { name, accent } = getTargetLanguage(language);
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
      voice: openAiVoices[voice],
      input: text,
      instructions: `Speak natural, clear ${name} with a native ${accent ? `${accent} ` : ""}accent, at a relaxed pace for a language learner.`,
      response_format: "mp3",
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (response.ok) return response.arrayBuffer();
  const body = await response.text().catch(() => "");
  console.error("openai speech failed", response.status, body.slice(0, 300));
  return [401, 402, 403].includes(response.status) || /insufficient_quota/.test(body) ? 503 : 502;
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return new Response(null, { status: 401 });
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const audio = await synthesizeWithOpenAi(parsed.data).catch(() => 502 as const);
  if (typeof audio === "number" || audio.byteLength === 0) {
    return new Response(null, { status: typeof audio === "number" ? audio : 502, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(audio, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}
