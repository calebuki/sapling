import { GameEntry, GameTitleEntry } from "@/components/game/game-entry";
import { LearningModelProvider } from "@/components/providers/learning-model-provider";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let learnerId = "demo";
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) return <GameTitleEntry />;
    learnerId = data.claims.sub;
  }

  return (
    <LearningModelProvider learnerId={learnerId}>
      <GameEntry />
    </LearningModelProvider>
  );
}
