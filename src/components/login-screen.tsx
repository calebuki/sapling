"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, LoaderCircle, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";

import { islandMeta } from "@/content/meta";
import { getTargetLanguage } from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/client";

// The 3D reel loads after the form so signing in is never waiting on WebGL.
const SceneReel = dynamic(() => import("./login/scene-reel").then((m) => m.SceneReel), { ssr: false });

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
    <main className="login">
      <aside className="login-panel">
        <span className="login-logo">
          <Sprout size={26} aria-hidden="true" /> Sapling
        </span>
        <form className="login-form" onSubmit={authenticate}>
          <h1>{signIn ? "Welcome back!" : "Create an account"}</h1>
          <p className="login-lede">
            {signIn ? "Sign in to pick up where you left off on the islands." : "Make an account to keep your progress on every island."}
          </p>
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
        </form>
        <ul className="login-islands" aria-label="Islands">
          {islandMeta.map((meta) => (
            <li key={meta.code}>
              <span className="login-swatch" style={{ background: meta.accent }} />
              <b>{meta.island}</b> · {getTargetLanguage(meta.code).name}
            </li>
          ))}
        </ul>
      </aside>
      <section className="login-stage" aria-hidden="true">
        <SceneReel />
      </section>
    </main>
  );
}
