import { getSpeechAudioUrl } from "@/lib/learning/course";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  const { clipId } = await params;
  const audioUrl = getSpeechAudioUrl(clipId);

  if (!audioUrl) {
    return Response.json({ error: "Unknown speech clip." }, { status: 404 });
  }

  return Response.redirect(new URL(audioUrl, request.url), 308);
}
