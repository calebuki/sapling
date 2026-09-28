import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { GameEntry } from "@/components/game/game-entry";
import { LearningModelProvider } from "@/components/providers/learning-model-provider";
import { islandMeta } from "@/content/meta";
import { hasSupabase } from "@/lib/env";
import { getTargetLanguage, isTargetLanguageCode, type TargetLanguageCode } from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ lang: string }> };

// Only islands that are open to visitors have a page.
function playable(lang: string): TargetLanguageCode | null {
  return isTargetLanguageCode(lang) && getTargetLanguage(lang).playable ? lang : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = playable((await params).lang);
  const meta = islandMeta.find((m) => m.code === code);
  if (!code || !meta) return {};
  return {
    title: `${meta.island} — Learn ${getTargetLanguage(code).name}`,
    description: meta.blurb,
  };
}

export default async function IslandPage({ params }: Props) {
  const code = playable((await params).lang);
  if (!code) notFound();

  let learnerId = "demo";
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) redirect("/login");
    learnerId = data.claims.sub;
  }

  return (
    <LearningModelProvider learnerId={learnerId} languageCode={code}>
      <GameEntry code={code} />
    </LearningModelProvider>
  );
}
