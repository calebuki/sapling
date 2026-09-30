import { publicEnv } from "@/lib/env";
import type { TargetLanguageCode } from "@/lib/learning/languages";

// Every neural line is generated once, ever, and kept as an MP3 in a public
// Supabase Storage bucket that every player reads from. A clip's path is a
// hash of everything that shapes how it sounds, so the browser and the server
// find the same file without asking anyone.

export const SPEECH_BUCKET = "speech";

// Bump when the voice direction changes enough that old clips should be redone.
export const CLIP_VERSION = "gemini-1";

export type ClipSpec = { language: TargetLanguageCode; voice: string; slow: boolean; text: string };

export function clipText(text: string) {
  return text.trim().normalize("NFC");
}

// Null where Web Crypto is missing (plain-http pages other than localhost).
export async function clipPath({ language, voice, slow, text }: ClipSpec): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const source = [CLIP_VERSION, language, voice, slow ? "slow" : "normal", clipText(text)].join("\n");
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(source));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${language}/${voice}/${slow ? "slow" : "normal"}/${hash}.mp3`;
}

export function publicClipUrl(path: string) {
  return publicEnv.supabaseUrl ? `${publicEnv.supabaseUrl}/storage/v1/object/public/${SPEECH_BUCKET}/${path}` : null;
}

// Earlier takes of a clip that review replaced, kept to compare against.
export function previousTakePath(path: string, take: number) {
  return `history/${path.replace(/\.mp3$/, "")}.take${take}.mp3`;
}
