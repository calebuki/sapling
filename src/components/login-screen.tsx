"use client";

import { useState } from "react";
import { ArrowRight, Leaf, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await createClient().auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/learn");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <span className="grid size-14 place-items-center rounded-[20px] bg-forest-900 text-cream-50 shadow-xl shadow-forest-950/15">
            <Leaf aria-hidden="true" size={25} />
          </span>
        </div>
        <section className="paper-panel rounded-[30px] p-7 sm:p-9">
          <div className="text-center">
            <h1 className="font-display text-4xl text-forest-950">
              Welcome back.
            </h1>
          </div>

          <form className="mt-7 space-y-4" onSubmit={signIn}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-forest-700/55">
                Email
              </span>
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-forest-900/12 bg-white/65 px-4 py-3.5 text-forest-950 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-400/15"
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
                autoComplete="current-password"
                className="mt-2 w-full rounded-2xl border border-forest-900/12 bg-white/65 px-4 py-3.5 text-forest-950 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-400/15"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 py-3.5 text-sm font-bold text-cream-50 transition enabled:hover:bg-forest-800 disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              <LockKeyhole aria-hidden="true" size={17} />
              {isSubmitting ? "Signing in…" : "Sign in"}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
