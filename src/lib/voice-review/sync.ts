import type { SupabaseClient } from "@supabase/supabase-js";

import { loadIsland } from "@/content/islands";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { collectLines } from "@/lib/speech/catalog";
import { clipPath } from "@/lib/speech/clips";
import type { Database } from "@/types/database";

// Brings voice_lines up to date with what an island says now (see
// sync_voice_lines): new lines are added, details of known ones refreshed,
// never their review.

export async function syncLanguage(supabase: SupabaseClient<Database>, code: TargetLanguageCode) {
  const island = await loadIsland(code);
  if (!island) return null;

  const lines = await Promise.all(
    collectLines(island).map(async (line) => ({
      path: (await clipPath({ language: code, ...line }))!,
      voice: line.voice,
      slow: line.slow,
      text: line.text,
      en: line.en,
      speaker: line.speaker,
      sources: line.sources,
      units: line.units,
      level: line.level,
    })),
  );

  const { data, error } = await supabase.rpc("sync_voice_lines", { p_language_code: code, p_lines: lines });
  if (error) throw new Error(`sync ${code}: ${error.message}`);
  return { language: code, lines: lines.length, ...data };
}
