import { Hub } from "@/components/hub/hub";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let learnerId: string | null = "demo";
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    learnerId = data?.claims?.sub ?? null;
  }
  return <Hub learnerId={learnerId} />;
}
