import { generateSpeech } from "ai";
import { z } from "zod";

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

const model = "google/gemini-3.8-flash-tts";

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
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { t: text, v, s } = parsed.data;
  try {
    const { audio } = await generateSpeech({
      model,
      text,
      voice: speechVoices[v as keyof typeof speechVoices],
      language: "sv",
      instructions: s === "1" ? slow : everyday,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(20_000),
    });
    const { bytes, type } = playable(new Uint8Array(audio.uint8Array), audio.mediaType);
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("speech generation failed", error);
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

// Gemini speech can arrive as bare 24 kHz 16-bit mono PCM, which browsers
// cannot play; give it a WAV header. Encoded formats pass through unchanged.
function playable(bytes: Uint8Array<ArrayBuffer>, mediaType: string) {
  const ascii = String.fromCharCode(...bytes.subarray(0, 4));
  if (ascii === "RIFF") return { bytes, type: "audio/wav" };
  if (ascii === "OggS") return { bytes, type: "audio/ogg" };
  if (ascii.startsWith("ID3") || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return { bytes, type: "audio/mpeg" };
  if (!/pcm|l16|raw/i.test(mediaType) && !/wav/i.test(mediaType)) return { bytes, type: mediaType };

  const rate = Number(/rate=(\d+)/.exec(mediaType)?.[1] ?? 24_000);
  const header = new DataView(new ArrayBuffer(44));
  const write = (offset: number, value: string) => [...value].forEach((c, i) => header.setUint8(offset + i, c.charCodeAt(0)));
  write(0, "RIFF");
  header.setUint32(4, 36 + bytes.length, true);
  write(8, "WAVEfmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, rate, true);
  header.setUint32(28, rate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  write(36, "data");
  header.setUint32(40, bytes.length, true);
  const wav = new Uint8Array(44 + bytes.length);
  wav.set(new Uint8Array(header.buffer), 0);
  wav.set(bytes, 44);
  return { bytes: wav, type: "audio/wav" };
}
