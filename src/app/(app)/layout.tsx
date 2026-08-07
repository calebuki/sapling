import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LearningModelProvider } from "@/components/providers/learning-model-provider";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ProductLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (!data?.claims) {
      redirect("/login");
    }
  }

  return (
    <LearningModelProvider>
      <AppShell>{children}</AppShell>
    </LearningModelProvider>
  );
}
