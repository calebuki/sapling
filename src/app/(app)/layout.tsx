import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LearningModelProvider } from "@/components/providers/learning-model-provider";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ProductLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let learnerId = "demo";
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    learnerId = data?.claims?.sub ?? "demo";
    if (!data?.claims) {
      redirect("/login");
    }
  }

  return (
    <LearningModelProvider learnerId={learnerId}>
      <AppShell>{children}</AppShell>
    </LearningModelProvider>
  );
}
