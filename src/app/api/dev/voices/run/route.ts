import { runNextJob } from "@/lib/voice-review/regenerate";
import { canGenerate, currentReviewer } from "@/lib/voice-review/server";

// Makes one queued line. The review page calls this in a loop while a
// reviewer has the queue running, so each request stays short.

export const maxDuration = 60;

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const reviewer = await currentReviewer();
  if (!reviewer) return new Response(null, { status: 403 });
  if (!canGenerate()) return Response.json({ error: "No voice provider: add GOOGLE_GENERATIVE_AI_API_KEY (or an OpenAI key)." }, { status: 503 });

  try {
    return Response.json(await runNextJob(reviewer.supabase));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
