"use client";

import {
  Languages,
  Leaf,
  LogOut,
  MessageCircle,
  Sprout,
  TreePine,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { hasSupabase } from "@/lib/env";
import { supportedLanguageCodes, targetLanguages } from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/client";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { StorybookBackdrop } from "@/components/storybook-backdrop";
import { useUiSounds } from "@/components/providers/ui-sound-provider";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMuted, toggleMuted } = useUiSounds();
  const {
    isSwitchingLanguage,
    selectTargetLanguage,
    targetLanguage,
  } = useLearningModel();
  const destinations = [
    { href: "/learn", label: "Learn", icon: Sprout },
    { href: "/practice", label: "Practice", icon: MessageCircle },
  ];

  async function signOut() {
    if (!hasSupabase) {
      return;
    }
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (pathname === "/" || targetLanguage.code === "sv") {
    return (
      <div className="relative isolate min-h-dvh w-full bg-forest-950">
        <StorybookBackdrop fixed />
        <header className="fixed inset-x-3 top-3 z-50 flex h-14 items-center gap-2 rounded-[18px] border border-white/45 bg-cream-50/82 px-2.5 shadow-xl shadow-forest-950/10 backdrop-blur-xl sm:inset-x-5 sm:top-5 sm:h-16 sm:px-3.5">
          <Link className="flex shrink-0 items-center gap-2" href="/">
            <span className="grid size-9 place-items-center rounded-[12px] bg-forest-950 text-cream-50 sm:size-10 sm:rounded-[14px]">
              <Leaf aria-hidden="true" size={18} strokeWidth={2.3} />
            </span>
            <span className="hidden text-lg font-extrabold tracking-[-0.045em] text-forest-950 min-[390px]:inline sm:text-xl">
              Sapling
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="ml-1 flex h-10 items-center rounded-[13px] border border-forest-950/9 bg-white/48 p-1 sm:ml-3"
          >
            {destinations.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`grid h-8 place-items-center rounded-[9px] px-2.5 text-[11px] font-extrabold transition sm:px-4 sm:text-xs ${
                    active
                      ? "bg-forest-950 text-cream-50 shadow-sm"
                      : "text-forest-900/72 hover:bg-white/75 hover:text-forest-950"
                  }`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1">
            <label className="hidden min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-forest-900/64 hover:bg-white/60 sm:flex">
              <Languages aria-hidden="true" className="shrink-0" size={16} />
              <span className="sr-only">Learning language</span>
              <select
                aria-label="Learning language"
                className="w-[3.7rem] appearance-none truncate bg-transparent text-[10px] font-extrabold text-forest-950 outline-none disabled:cursor-wait disabled:opacity-55 sm:w-auto sm:text-[11px]"
                disabled={isSwitchingLanguage}
                onChange={(event) => {
                  void selectTargetLanguage(
                    event.target.value as (typeof supportedLanguageCodes)[number],
                  ).catch(() => undefined);
                }}
                value={targetLanguage.code}
              >
                {supportedLanguageCodes.map((languageCode) => (
                  <option key={languageCode} value={languageCode}>
                    {targetLanguages[languageCode].endonym}
                  </option>
                ))}
              </select>
            </label>
            <Link
              aria-label={`My ${targetLanguage.name}`}
              className="rounded-xl p-2 text-forest-900/58 transition hover:bg-white/70 hover:text-forest-950"
              href="/progress"
            >
              <TreePine aria-hidden="true" size={17} />
            </Link>
            <button
              aria-label={isMuted ? "Turn on sounds" : "Mute sounds"}
              aria-pressed={isMuted}
              className="rounded-xl p-2 text-forest-900/58 transition hover:bg-white/70 hover:text-forest-950"
              onClick={toggleMuted}
              type="button"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" size={17} />
              ) : (
                <Volume2 aria-hidden="true" size={17} />
              )}
            </button>
            {hasSupabase ? (
              <button
                aria-label="Sign out"
                className="hidden rounded-xl p-2 text-forest-900/58 transition hover:bg-white/70 hover:text-forest-950 min-[430px]:block"
                onClick={signOut}
                type="button"
              >
                <LogOut aria-hidden="true" size={17} />
              </button>
            ) : null}
          </div>
        </header>

        <main
          className={`route-enter relative z-10 ${
            pathname === "/" || pathname.startsWith("/practice")
              ? ""
              : "min-h-dvh pt-20 sm:pt-24"
          }`}
          key={pathname}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1720px] md:grid md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-forest-950/8 bg-cream-50/72 px-5 py-6 backdrop-blur-xl md:flex">
        <Link
          href="/learn"
          className="flex items-center gap-3 rounded-2xl px-2 py-1"
        >
          <span className="grid size-10 place-items-center rounded-[14px] bg-forest-950 text-cream-50 shadow-lg shadow-forest-950/12">
            <Leaf aria-hidden="true" size={20} strokeWidth={2.4} />
          </span>
          <span className="text-xl font-extrabold leading-none tracking-[-0.045em] text-forest-950">
            Sapling
          </span>
        </Link>

        <label className="mt-7 flex items-center gap-2.5 rounded-[14px] border border-forest-950/9 bg-white/58 px-3 py-2.5 text-forest-900/65">
          <Languages aria-hidden="true" className="shrink-0" size={17} />
          <span className="sr-only">Learning language</span>
          <select
            aria-label="Learning language"
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-[12px] font-extrabold text-forest-950 outline-none disabled:cursor-wait disabled:opacity-55"
            disabled={isSwitchingLanguage}
            onChange={(event) => {
              void selectTargetLanguage(
                event.target.value as (typeof supportedLanguageCodes)[number],
              ).catch(() => undefined);
            }}
            value={targetLanguage.code}
          >
            {supportedLanguageCodes.map((languageCode) => (
              <option key={languageCode} value={languageCode}>
                {targetLanguages[languageCode].endonym}
              </option>
            ))}
          </select>
        </label>

        <nav aria-label="Primary" className="mt-7 space-y-1.5">
          {destinations.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[13px] font-bold transition ${
                  active
                    ? "bg-moss-300/36 text-forest-950"
                    : "text-forest-900/66 hover:bg-white/75 hover:text-forest-950"
                }`}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1.5">
          <button
            aria-label={isMuted ? "Turn on sounds" : "Mute sounds"}
            aria-pressed={isMuted}
            className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-[13px] font-bold text-forest-900/58 transition hover:bg-white/75 hover:text-forest-950"
            onClick={toggleMuted}
            type="button"
          >
            {isMuted ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
            {isMuted ? "Sounds off" : "Sounds on"}
          </button>
          <Link
            className="flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[13px] font-bold text-forest-900/58 transition hover:bg-white/75 hover:text-forest-950"
            href="/progress"
          >
            <TreePine aria-hidden="true" size={18} />
            My {targetLanguage.name}
          </Link>
          {hasSupabase ? (
            <button
              className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-[13px] font-bold text-forest-900/58 transition hover:bg-white/75 hover:text-forest-950"
              onClick={signOut}
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
              Sign out
            </button>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-forest-950/8 bg-cream-100/88 px-5 py-3.5 backdrop-blur-xl md:hidden">
          <Link
            href="/learn"
            className="flex items-center gap-2.5"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-forest-950 text-cream-50">
              <Leaf aria-hidden="true" size={18} />
            </span>
            <span className="text-xl font-extrabold tracking-[-0.045em] text-forest-950">Sapling</span>
          </Link>
          <label className="ml-auto flex items-center gap-1.5 rounded-xl border border-forest-950/9 bg-white/58 px-2.5 py-2 text-forest-900/65">
            <Languages aria-hidden="true" size={16} />
            <span className="sr-only">Learning language</span>
            <select
              aria-label="Learning language"
              className="appearance-none bg-transparent text-[11px] font-extrabold text-forest-950 outline-none disabled:cursor-wait disabled:opacity-55"
              disabled={isSwitchingLanguage}
              onChange={(event) => {
                void selectTargetLanguage(
                  event.target.value as (typeof supportedLanguageCodes)[number],
                ).catch(() => undefined);
              }}
              value={targetLanguage.code}
            >
              {supportedLanguageCodes.map((languageCode) => (
                <option key={languageCode} value={languageCode}>
                  {targetLanguages[languageCode].endonym}
                </option>
              ))}
            </select>
          </label>
          <Link
            aria-label={`My ${targetLanguage.name}`}
            className="rounded-xl p-2 text-forest-900/55 transition hover:bg-white/70 hover:text-forest-950"
            href="/progress"
          >
            <TreePine aria-hidden="true" size={18} />
          </Link>
          <button
            aria-label={isMuted ? "Turn on sounds" : "Mute sounds"}
            aria-pressed={isMuted}
            className="rounded-xl p-2 text-forest-900/55 transition hover:bg-white/70 hover:text-forest-950"
            onClick={toggleMuted}
            type="button"
          >
            {isMuted ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
          </button>
          {hasSupabase ? (
            <button
              aria-label="Sign out"
              className="rounded-xl p-2 text-forest-900/55 transition hover:bg-white/70 hover:text-forest-950"
              onClick={signOut}
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
            </button>
          ) : null}
        </header>

        <main className="route-enter" key={pathname}>
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-2 rounded-[20px] border border-forest-950/10 bg-forest-950/96 p-1.5 shadow-2xl shadow-forest-950/24 backdrop-blur-xl md:hidden"
      >
        {destinations.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[14px] px-1 py-2 text-[9px] font-bold transition ${
                active ? "bg-cream-100 text-forest-950" : "text-cream-100/60"
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={18} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
