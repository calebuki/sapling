"use client";

import {
  BookOpen,
  ChevronDown,
  Leaf,
  LogOut,
  MessageCircle,
  Sprout,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasSupabase } from "@/lib/env";
import {
  supportedLanguageCodes,
  targetLanguages,
} from "@/lib/learning/languages";
import { createClient } from "@/lib/supabase/client";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { useUiSounds } from "@/components/providers/ui-sound-provider";

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  const router = useRouter();
  const { isMuted, toggleMuted } = useUiSounds();
  const { isSwitchingLanguage, selectTargetLanguage, targetLanguage, error } =
    useLearningModel();
  const [accountError, setAccountError] = useState<string | null>(null);
  const destinations = [
    { href: "/learn", label: "Learn", icon: Sprout },
    { href: "/practice", label: "Practice", icon: MessageCircle },
  ];
  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) {
      setAccountError(error.message);
      return;
    }
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="life-app">
      <a className="life-skip" href="#main-content">
        Skip to content
      </a>
      <header className="life-header">
        <Link className="life-brand" href="/" aria-label="Sapling home">
          <span>
            <Leaf size={23} />
          </span>
          Sapling<span className="life-brand-dot">.</span>
        </Link>
        <nav className="life-navigation" aria-label="Primary">
          {destinations.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="life-account">
          <Link
            className="life-journal-link"
            aria-label="My journal"
            href="/progress"
            aria-current={pathname === "/progress" ? "page" : undefined}
          >
            <BookOpen size={18} />
            <span>My journal</span>
          </Link>
          <details className="life-settings">
            <summary aria-label="Language and account settings">
              <span>{targetLanguage.endonym}</span>
              <ChevronDown size={14} />
            </summary>
            <div className="life-settings-menu">
              <label htmlFor="life-language">Learning language</label>
              <select
                id="life-language"
                disabled={isSwitchingLanguage}
                value={targetLanguage.code}
                onChange={(event) =>
                  void selectTargetLanguage(
                    event.target
                      .value as (typeof supportedLanguageCodes)[number],
                  ).catch(() => undefined)
                }
              >
                {supportedLanguageCodes.map((code) => (
                  <option key={code} value={code}>
                    {targetLanguages[code].endonym}
                  </option>
                ))}
              </select>
              <button type="button" onClick={toggleMuted}>
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                {isMuted ? "Turn sounds on" : "Mute sounds"}
              </button>
              {hasSupabase ? (
                <button
                  type="button"
                  onClick={() =>
                    void signOut().catch(() =>
                      setAccountError("Could not sign out. Try again."),
                    )
                  }
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              ) : null}
            </div>
          </details>
        </div>
      </header>
      {error || accountError ? (
        <p className="life-error life-global-error" role="alert">
          {accountError ?? error}
        </p>
      ) : null}
      <main id="main-content" className="life-main">
        {children}
      </main>
    </div>
  );
}
