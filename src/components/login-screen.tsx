"use client";

import { useState } from "react";
import { ArrowRight, Leaf, LockKeyhole, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { LoginScene } from "@/components/login-scene";

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

    router.push("/learn");
    router.refresh();
  }

  function switchMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setError(null);
  }

  return (
    <main className="grid min-h-dvh bg-cream-100 lg:grid-cols-[minmax(380px,0.78fr)_minmax(540px,1.22fr)]">
      <section className="relative z-10 flex items-center justify-center px-5 py-10 sm:px-10 lg:py-14">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[15px] bg-forest-900 text-cream-50 shadow-lg shadow-forest-950/15">
              <Leaf aria-hidden="true" size={21} />
            </span>
            <span className="font-display text-[1.7rem] text-forest-950">Sapling</span>
          </div>

          <div>
            <h1 className="font-display text-[2.7rem] leading-[1.02] tracking-[-0.035em] text-forest-950 sm:text-5xl">
              {mode === "sign-in" ? "Welcome back." : "Create an account."}
            </h1>
          </div>

          <form className="mt-8 space-y-4" onSubmit={authenticate}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">
                Email
              </span>
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-forest-900/12 bg-white/55 px-4 py-3.5 text-forest-950 outline-none transition placeholder:text-forest-900/25 focus:border-moss-500 focus:bg-white/80 focus:ring-4 focus:ring-moss-400/15"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">
                Password
              </span>
              <input
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                className="mt-2 w-full rounded-2xl border border-forest-900/12 bg-white/55 px-4 py-3.5 text-forest-950 outline-none transition focus:border-moss-500 focus:bg-white/80 focus:ring-4 focus:ring-moss-400/15"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <p aria-live="polite" className="rounded-xl bg-clay-400/10 p-3 text-sm text-forest-950">
                {error}
              </p>
            ) : null}

            <button
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 shadow-lg shadow-forest-950/10 transition enabled:hover:-translate-y-0.5 enabled:hover:bg-forest-800 enabled:hover:shadow-xl disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {mode === "sign-in" ? (
                <LockKeyhole aria-hidden="true" size={17} />
              ) : (
                <UserPlus aria-hidden="true" size={17} />
              )}
              {isSubmitting
                ? mode === "sign-in"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
              {!isSubmitting ? (
                <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" size={17} />
              ) : null}
            </button>
          </form>

          <button
            className="mt-5 w-full text-center text-sm font-bold text-forest-900/58 transition hover:text-forest-950"
            disabled={isSubmitting}
            onClick={switchMode}
            type="button"
          >
            {mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>

        </div>
      </section>

      <section aria-label="A moving illustration of a Scandinavian village" className="order-first min-h-[310px] lg:order-none lg:m-3 lg:ml-0 lg:min-h-0 lg:rounded-[32px] lg:[clip-path:inset(0_round_32px)]">
        <LoginScene />
      </section>
    </main>
  );
}
