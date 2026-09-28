"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const result =
      mode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMode("sign-in");
      setError("Account created. Sign in to continue.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const signIn = mode === "sign-in";
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={authenticate}>
        <h1>
          {signIn ? "Welcome back!" : "Create an account"}
        </h1>
        <label>
          Email
          <input autoComplete="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
        </label>
        <label>
          Password
          <input
            autoComplete={signIn ? "current-password" : "new-password"}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <button className="btn btn-primary btn-big" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoaderCircle className="spin" size={20} /> : null}
          {signIn ? "Sign in" : "Create account"}
          {!isSubmitting ? <ArrowRight size={20} /> : null}
        </button>
        <button
          className="btn btn-quiet"
          disabled={isSubmitting}
          onClick={() => {
            setMode(signIn ? "sign-up" : "sign-in");
            setError(null);
          }}
          type="button"
        >
          {signIn ? "Create an account" : "Back to sign in"}
        </button>
        <Link className="btn btn-quiet" href="/">
          Back to Sapling
        </Link>
      </form>
    </main>
  );
}
