import { speechModel } from "@/lib/ai-models";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// The voice review tool (/dev/voices) is for reviewers only: everyone else
// gets a 404 from the page and a 403 from its routes. Everything it does runs
// as the reviewer, through their session and the voice review policies.

export async function currentReviewer() {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: isReviewer } = await supabase.rpc("is_voice_reviewer");
  return isReviewer ? { supabase, userId } : null;
}

// Whether this server can make clips at all (Gemini, or OpenAI as a stand-in).
export function canGenerate() {
  return Boolean(speechModel() || process.env.OPENAI_TTS_KEY?.trim() || process.env.OPENAI_LIVE_VOICE_KEY?.trim());
}
