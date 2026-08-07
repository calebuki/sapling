import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/login-screen";
import { hasSupabase } from "@/lib/env";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  if (!hasSupabase) {
    redirect("/learn");
  }

  return <LoginScreen />;
}
