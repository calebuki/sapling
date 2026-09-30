import { z } from "zod";

import { supportedLanguageCodes } from "@/lib/learning/languages";
import { currentReviewer } from "@/lib/voice-review/server";
import { syncLanguage } from "@/lib/voice-review/sync";

// Reviewers refresh the voice line list from the islands' content.

const inputSchema = z.object({ languages: z.array(z.enum(supportedLanguageCodes)).min(1).default([...supportedLanguageCodes]) });

export const maxDuration = 60;

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const reviewer = await currentReviewer();
  if (!reviewer) return new Response(null, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return new Response(null, { status: 400 });

  try {
    const results = [];
    for (const code of parsed.data.languages) {
      const result = await syncLanguage(reviewer.supabase, code);
      if (result) results.push(result);
    }
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
