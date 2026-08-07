import { hasSupabase } from "@/lib/env";
import { hasAzureSpeech, serverEnv } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!hasAzureSpeech) {
    return Response.json(
      { error: "Speaking practice is not configured yet." },
      { status: 503 },
    );
  }

  if (hasSupabase) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims?.sub) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
  }

  try {
    const azureResponse = await fetch(
      `https://${serverEnv.azureSpeechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": serverEnv.azureSpeechKey,
          "Content-Length": "0",
        },
        cache: "no-store",
      },
    );

    if (!azureResponse.ok) {
      return Response.json(
        { error: "Speaking practice is temporarily unavailable." },
        { status: 502 },
      );
    }

    return Response.json(
      {
        token: await azureResponse.text(),
        region: serverEnv.azureSpeechRegion,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Speaking practice is temporarily unavailable." },
      { status: 502 },
    );
  }
}
