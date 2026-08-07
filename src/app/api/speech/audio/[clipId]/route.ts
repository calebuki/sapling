import { getSpeechClip } from "@/lib/learning/course";
import { hasAzureSpeech, serverEnv } from "@/lib/server-env";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  const { clipId } = await params;
  const clip = getSpeechClip(clipId);

  if (!clip) {
    return Response.json({ error: "Unknown speech clip." }, { status: 404 });
  }

  if (!hasAzureSpeech) {
    return Response.json(
      { error: "Danish audio is not configured yet." },
      { status: 503 },
    );
  }

  const endpoint = `https://${serverEnv.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="da-DK"><voice name="${clip.voice}">${escapeXml(clip.text)}</voice></speak>`;

  try {
    const azureResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": serverEnv.azureSpeechKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "SaplingLanguageLearning",
      },
      body: ssml,
    });

    if (!azureResponse.ok || !azureResponse.body) {
      return Response.json(
        { error: "Danish audio is temporarily unavailable." },
        { status: 502 },
      );
    }

    return new Response(azureResponse.body, {
      headers: {
        "Cache-Control": "public, s-maxage=31536000, immutable",
        "Content-Type": "audio/mpeg",
      },
    });
  } catch {
    return Response.json(
      { error: "Danish audio is temporarily unavailable." },
      { status: 502 },
    );
  }
}
