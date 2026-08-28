import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/login-screen";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in or create an account" };

export default async function LoginPage() {
  if (!hasSupabase) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/");
  }

  return <LoginScreen />;
}
