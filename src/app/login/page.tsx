import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/login-screen";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (!hasSupabase) {
    redirect("/learn");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/learn");
  }

  return <LoginScreen />;
}
