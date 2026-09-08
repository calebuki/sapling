import { AppShell } from "@/components/app-shell";
import { HomeLanding } from "@/components/home-landing";
import { WelcomeHome } from "@/components/welcome-home";
import { LearningModelProvider } from "@/components/providers/learning-model-provider";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let learnerId: string | undefined;
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    learnerId = data?.claims?.sub;
  }

  if (!learnerId) return <WelcomeHome />;

  return (
    <LearningModelProvider learnerId={learnerId}>
      <AppShell><HomeLanding /></AppShell>
    </LearningModelProvider>
  );
}
