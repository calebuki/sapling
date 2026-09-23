import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapConcept, mapState } from "@/lib/repositories/supabase-learning-repository";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { voiceContext, voiceInstructions } from "@/lib/voice/pedagogy";
import { hasSupabase } from "@/lib/env";

const inputSchema = z.object({ sdp: z.string().min(1).max(60000), scenarioId: z.string().max(80).optional() });
export const maxDuration = 30;

export async function GET() {
  return Response.json({ available: Boolean(process.env.OPENAI_API_KEY && hasSupabase) },
    { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Unexpected origin." }, { status: 403 });
  }
  if (!hasSupabase) return Response.json({ error: "Sign in to use live voice." }, { status: 503 });
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return Response.json({ error: "Sign in to use live voice." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Live voice is not configured. Listening and typed practice are available." }, { status: 503 });
  if (Number(request.headers.get("content-length")) > 65000) return new Response(null, { status: 413 });
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid voice request." }, { status: 400 });
  const [catalog, progress] = await Promise.all([
    db.from("concepts").select("*").eq("language_code", "sv").eq("is_active", true).order("sort_order"),
    db.from("learner_concept_state").select("*").eq("user_id", auth.user.id),
  ]);
  if (catalog.error || progress.error) return Response.json({ error: "Your learning context could not be loaded." }, { status: 503 });
  const concepts = catalog.data.map(mapConcept);
  const states = progress.data.map(mapState);
  const recommendation = choosePracticeScenario({
    languageCode: "sv", concepts, states,
    snapshot: { memories: [], continuity: [], recentScenarioIds: [], completedScenarioIds: [] },
  });
  // The client may suggest a scene, but cannot override pedagogical eligibility.
  const requested = input.data.scenarioId ? choosePracticeScenario({
    languageCode: "sv", concepts, states, scenarioIds: [input.data.scenarioId],
    snapshot: { memories: [], continuity: [], recentScenarioIds: [], completedScenarioIds: [] },
  }) : recommendation;
  const chosen = requested.encounteredConceptSlugs.length >= requested.scenario.minimumEncountered ? requested : recommendation;
  const context = voiceContext(chosen.scenario, concepts, states);
  const reservation = await db.rpc("reserve_live_session", { p_scenario_id: chosen.scenario.id });
  if (reservation.error) return Response.json({ error: "Voice is already running or its hourly limit was reached. Keep practicing with text or listening." }, { status: 429 });
  try {
    const upstream = await fetch("https://api.openai.com/v1/live/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: { model: "gpt-live-1", store: false, instructions: voiceInstructions(context), delegation: { type: "client" } },
        transport: { type: "webrtc", sdp: input.data.sdp },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!upstream.ok) throw new Error("Live provider unavailable");
    const result = await upstream.json();
    if (typeof result.session?.id !== "string" || typeof result.transport?.sdp !== "string") throw new Error("Invalid voice response");
    const saved = await db.from("learning_sessions").update({
      configuration: { language_code: "sv", scenario_id: chosen.scenario.id, live_id: result.session.id,
        targets: context.targets.map(t => t.slug), audio_retained: false },
    }).eq("id", reservation.data).eq("user_id", auth.user.id);
    if (saved.error) throw new Error("Could not save session");
    return Response.json({ ...result, learningSessionId: reservation.data, scenario: chosen.scenario.title,
      opening: chosen.scenario.openingLine, secondsLimit: 180 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await db.from("learning_sessions").update({ status: "abandoned" }).eq("id", reservation.data);
    return Response.json({ error: "Live voice could not connect. Continue with listening or typed practice." }, { status: 502 });
  }
}
