import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VoiceReview } from "@/components/dev/voice-review";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { canGenerate } from "@/lib/voice-review/server";

// Listening through every neural voice line. Only voice reviewers get a page;
// for everyone else it doesn't exist.

export const metadata: Metadata = { title: "Voice review" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VoiceReviewPage({ searchParams }: Props) {
  if (!hasSupabase) notFound();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: isReviewer } = await supabase.rpc("is_voice_reviewer");
  if (!isReviewer) notFound();

  return <VoiceReview initialQuery={await searchParams} userId={userId} canGenerate={canGenerate()} />;
}
