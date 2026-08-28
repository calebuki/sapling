"use client";

import { useState } from "react";
import { ArrowRight, Leaf, LockKeyhole, UserPlus } from "lucide-react";
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

  function switchMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setError(null);
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <span className="grid size-14 place-items-center rounded-[20px] bg-forest-900 text-cream-50 shadow-xl shadow-forest-950/15">
            <Leaf aria-hidden="true" size={25} />
          </span>
        </div>
        <section className="paper-panel rounded-[24px] p-7 sm:p-9">
          <div className="text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/58">Sapling languages</p>
            <h1 className="font-display text-3xl text-forest-950 sm:text-4xl">
              {mode === "sign-in" ? "Welcome back." : "Create an account."}
            </h1>
          </div>

          <form className="mt-7 space-y-4" onSubmit={authenticate}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">
                Email
              </span>
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-[14px] border border-forest-900/14 bg-white/72 px-4 py-3.5 font-semibold text-forest-950 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-400/15"
                onChange={(event) => setEmail(event.target.value)}
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
                className="mt-2 w-full rounded-[14px] border border-forest-900/14 bg-white/72 px-4 py-3.5 font-semibold text-forest-950 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-400/15"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <p className="rounded-xl bg-clay-400/10 p-3 text-sm text-forest-950">
                {error}
              </p>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-forest-950 px-5 py-3.5 text-sm font-extrabold text-cream-50 transition enabled:hover:bg-forest-800 disabled:opacity-50"
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
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </button>
          </form>

          <button
            className="mt-5 w-full text-center text-sm font-bold text-forest-900/62 transition hover:text-forest-950"
            disabled={isSubmitting}
            onClick={switchMode}
            type="button"
          >
            {mode === "sign-in" ? "Create an account" : "Back to sign in"}
          </button>
        </section>
      </div>
    </main>
  );
}
