"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Clock, LogIn, LogOut, Sprout, Star } from "lucide-react";
import { readSave } from "@/components/game/store";
import { islandMeta, type IslandMeta } from "@/content/meta";
import { getTargetLanguage, type TargetLanguageCode } from "@/lib/learning/languages";
import { summarize, type LanguageProgress, type LevelProgress } from "@/lib/learning/overview";
import { createLearningRepository } from "@/lib/repositories";
import type { LearningOverview } from "@/lib/repositories/types";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { IslandArt } from "./island-art";
import { SaplingMascot } from "./sapling-mascot";

// Home: every island, how far along each language is, and a way back in.

type Saves = Partial<Record<TargetLanguageCode, ReturnType<typeof readSave>>>;
const noSaves: Saves = {};
const noSubscription = () => () => undefined;
let cachedSaves: { learnerId: string; saves: Saves } | null = null;
function savesFor(learnerId: string) {
  if (cachedSaves?.learnerId !== learnerId) {
    cachedSaves = { learnerId, saves: Object.fromEntries(islandMeta.map((m) => [m.code, readSave(learnerId, m.code)])) };
  }
  return cachedSaves.saves;
}

// The mascot says hello in the language you were last learning.
const HELLO: Record<TargetLanguageCode, string> = { sv: "Hej", de: "Hallo", vi: "Xin chào", da: "Hej" };

type Status = { kind: "loading" } | { kind: "ready"; overview: LearningOverview } | { kind: "error" } | { kind: "signed-out" };

export function Hub({ learnerId }: { learnerId: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(learnerId ? { kind: "loading" } : { kind: "signed-out" });

  useEffect(() => {
    if (!learnerId) return;
    let active = true;
    createLearningRepository()
      .loadOverview()
      .then((overview) => active && setStatus({ kind: "ready", overview }))
      .catch(() => active && setStatus({ kind: "error" }));
    return () => {
      active = false;
    };
  }, [learnerId]);

  const progress = useMemo(() => (status.kind === "ready" ? summarize(status.overview) : null), [status]);
  // Island saves live in this browser: they know your name and which islands you've visited.
  const saves = useSyncExternalStore(
    noSubscription,
    () => (learnerId ? savesFor(learnerId) : noSaves),
    () => noSaves,
  );
  const name = Object.values(saves).find((s) => s?.name)?.name ?? null;
  const last = status.kind === "ready" ? status.overview.lastLanguage : null;
  const totals = progress
    ? Object.values(progress).reduce((sum, p) => ({ met: sum.met + p.met, strong: sum.strong + p.strong, due: sum.due + p.due }), { met: 0, strong: 0, due: 0 })
    : null;

  return (
    <main className="hub">
      <header className="hub-top">
        <span className="hub-logo">
          <Sprout size={26} aria-hidden="true" /> Sapling
        </span>
        {learnerId && hasSupabase ? (
          <button
            className="btn btn-quiet hub-account"
            onClick={async () => {
              await createClient().auth.signOut();
              router.replace("/login");
              router.refresh();
            }}
          >
            <LogOut size={17} /> Sign out
          </button>
        ) : !learnerId ? (
          <Link className="btn hub-account" href="/login">
            <LogIn size={17} /> Sign in
          </Link>
        ) : null}
      </header>

      <section className="hub-hero">
        <SaplingMascot greeting={`${HELLO[last ?? "sv"]}${name ? `, ${name}` : ""}!`} lang={last ?? "sv"} />
        <h1>{name ? `Welcome back, ${name}.` : "Learn a language on an island."}</h1>
        <p>
          Each island speaks one language. Walk around, meet the people who live there, and learn by talking with them, from
          your first hello to confident everyday conversation (A2).
        </p>
        {totals && totals.met > 0 ? (
          <ul className="hub-totals" aria-label="Across all islands">
            <li>
              <BookOpen size={18} aria-hidden="true" />
              <strong>{totals.met}</strong> words and phrases met
            </li>
            <li>
              <Star size={18} aria-hidden="true" />
              <strong>{totals.strong}</strong> grown strong
            </li>
            <li>
              <Clock size={18} aria-hidden="true" />
              <strong>{totals.due}</strong> ready to review
            </li>
          </ul>
        ) : null}
      </section>

      <section className="hub-islands" aria-label="Islands">
        {islandMeta.map((meta) => (
          <IslandCard
            key={meta.code}
            meta={meta}
            progress={progress?.[meta.code] ?? null}
            visited={Boolean(saves[meta.code]?.introDone)}
            isLast={last === meta.code}
            signedIn={Boolean(learnerId)}
            loading={status.kind === "loading"}
          />
        ))}
      </section>

      {status.kind === "error" ? (
        <p className="hub-error" role="alert">
          Your progress couldn&apos;t be loaded just now. The islands still work; try refreshing in a moment.
        </p>
      ) : null}

      <footer className="hub-foot">
        <p>
          Progress only grows from what you actually say and understand. Hover any word on an island to see what it means.
        </p>
      </footer>
    </main>
  );
}

function IslandCard({
  meta,
  progress,
  visited,
  isLast,
  signedIn,
  loading,
}: {
  meta: IslandMeta;
  progress: LanguageProgress | null;
  visited: boolean;
  isLast: boolean;
  signedIn: boolean;
  loading: boolean;
}) {
  const language = getTargetLanguage(meta.code);
  const started = Boolean(progress && progress.met > 0) || visited;
  const style = { "--accent": meta.accent, "--accent-edge": meta.accentEdge } as React.CSSProperties;
  return (
    <article className={`island-card ${language.playable ? "" : "is-soon"} ${isLast && started ? "is-last" : ""}`} style={style}>
      <div className="island-card-art">
        <IslandArt art={meta.art} />
        {isLast && started ? <span className="island-card-ribbon">Continue here</span> : null}
      </div>
      <div className="island-card-body">
        <p className="island-card-lang">
          {language.name} · <span lang={language.locale}>{language.endonym}</span>
        </p>
        <h2>
          {language.playable ? meta.island : "Danish island"}
          {language.playable ? <span className="island-card-en">{meta.islandEn}</span> : null}
        </h2>
        <p className="island-card-blurb">{meta.blurb}</p>
        {language.playable && signedIn ? <Levels progress={progress} loading={loading} /> : null}
        {language.playable ? (
          <Link className="btn btn-primary island-card-go" href={signedIn ? `/${meta.code}` : "/login"} prefetch={false}>
            {!signedIn ? "Sign in to play" : started ? "Continue" : "Start"} <ArrowRight size={18} />
          </Link>
        ) : (
          <span className="island-card-soon">Coming soon</span>
        )}
      </div>
    </article>
  );
}

function Levels({ progress, loading }: { progress: LanguageProgress | null; loading: boolean }) {
  if (loading || !progress) {
    return <div className="island-levels is-loading" aria-hidden="true" />;
  }
  return (
    <div className="island-levels">
      <LevelBar label="A1" level={progress.levels.A1} />
      <LevelBar label="A2" level={progress.levels.A2} />
      <p className="island-levels-note">
        {progress.met === 0
          ? `${progress.total} words and phrases to discover`
          : `${progress.met} of ${progress.total} met · ${progress.strong} strong${progress.due ? ` · ${progress.due} to review` : ""}`}
        {progress.reached ? <strong className="island-levels-reached"> · {progress.reached} reached</strong> : null}
      </p>
    </div>
  );
}

function LevelBar({ label, level }: { label: string; level: LevelProgress }) {
  const met = level.total ? level.met / level.total : 0;
  const strong = level.total ? level.strong / level.total : 0;
  return (
    <div className="level-bar">
      <span className="level-bar-label">{label}</span>
      <span
        className="level-bar-track"
        role="progressbar"
        aria-label={`${label}: ${level.strong} of ${level.total} strong, ${level.met} met`}
        aria-valuemin={0}
        aria-valuemax={level.total}
        aria-valuenow={level.strong}
      >
        <span className="level-bar-met" style={{ width: `${met * 100}%` }} />
        <span className="level-bar-strong" style={{ width: `${strong * 100}%` }} />
      </span>
      <span className="level-bar-count">{Math.round(met * 100)}%</span>
    </div>
  );
}

