import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Neural Swedish speech for lines that have no recording, used when the
// learner's device has no working Swedish voice of its own. Azure matches the
// recorded clips' voices; OpenAI covers deployments that only have that key.

const inputSchema = z.object({
  text: z.string().trim().min(1).max(400),
  voice: z.enum(["female", "male"]).default("female"),
  pitch: z.number().min(0.5).max(2).default(1),
});

type SpeechInput = z.infer<typeof inputSchema>;

export const maxDuration = 20;

const azureVoices = { female: "sv-SE-SofieNeural", male: "sv-SE-MattiasNeural" } as const;
const openAiVoices = { female: "coral", male: "ash" } as const;

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

async function synthesizeWithAzure({ text, voice, pitch }: SpeechInput) {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  if (!key || !region) return null;
  const shift = Math.round((pitch - 1) * 40);
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "Ocp-Apim-Subscription-Key": key,
      "User-Agent": "Sapling",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    },
    body: `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="sv-SE"><voice name="${azureVoices[voice]}"><prosody pitch="${shift >= 0 ? "+" : ""}${shift}%">${escapeXml(text)}</prosody></voice></speak>`,
    signal: AbortSignal.timeout(8000),
  });
  return response.ok ? response.arrayBuffer() : null;
}

async function synthesizeWithOpenAi({ text, voice }: SpeechInput) {
  const key = process.env.OPENAI_TTS_KEY?.trim() || process.env.OPENAI_LIVE_VOICE_KEY?.trim();
  if (!key) return null;
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
      voice: openAiVoices[voice],
      input: text,
      instructions: "Speak natural, clear Swedish with a native Swedish accent, at a relaxed pace for a language learner.",
      response_format: "mp3",
    }),
    signal: AbortSignal.timeout(12000),
  });
  return response.ok ? response.arrayBuffer() : null;
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

  for (const synthesize of [synthesizeWithAzure, synthesizeWithOpenAi]) {
    const audio = await synthesize(parsed.data).catch(() => null);
    if (audio && audio.byteLength > 0) {
      return new Response(audio, {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
      });
    }
  }
  return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
}
