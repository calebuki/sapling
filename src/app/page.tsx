import { Hub } from "@/components/hub/hub";
import { LoginScreen } from "@/components/login-screen";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let learnerId: string | null = "demo";
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    learnerId = data?.claims?.sub ?? null;
  }
  // Signed-out visitors land on the login page and its island scenes.
  if (!learnerId) return <LoginScreen />;
  return <Hub learnerId={learnerId} />;
}
