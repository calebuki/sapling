import { google } from "@ai-sdk/google";

// Server-only model choice. A Gemini API key calls Google directly; otherwise
// requests go through AI Gateway (automatic on Vercel, or AI_GATEWAY_API_KEY).
// Returns null when neither is configured so routes can use their fallbacks.

const hasGoogleKey = () => Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const hasGateway = () => Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL);

/** "fast" for short glosses and replies, "smart" for conversations and evaluation. */
export function textModel(tier: "fast" | "smart") {
  if (hasGoogleKey()) return google(tier === "fast" ? "gemini-3.5-flash-lite" : "gemini-3.8-flash");
  if (hasGateway()) return tier === "fast" ? "openai/gpt-5.4-nano" : "openai/gpt-5.6-luna";
  return null;
}

export function speechModel() {
  if (hasGoogleKey()) return google.speech("gemini-3.8-flash-tts");
  if (hasGateway()) return "google/gemini-3.8-flash-tts";
  return null;
}
