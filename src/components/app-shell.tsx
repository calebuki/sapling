"use client";

import {
  AudioLines,
  Leaf,
  LogOut,
  MessageCircle,
  Sprout,
  TreePine,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const destinations = [
  { href: "/learn", label: "Learn", icon: Sprout },
  { href: "/ear", label: "Listen & Speak", icon: AudioLines },
  { href: "/my-danish", label: "Mit dansk", icon: TreePine },
  { href: "/world", label: "World", icon: MessageCircle },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    if (!hasSupabase) {
      return;
    }
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1500px] md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-forest-900/10 bg-cream-100/80 px-5 py-7 backdrop-blur-xl md:flex">
        <Link href="/learn" className="flex items-center gap-3 px-2">
          <span className="grid size-11 place-items-center rounded-[16px] bg-forest-800 text-cream-50 shadow-lg shadow-forest-900/15">
            <Leaf aria-hidden="true" size={22} strokeWidth={2.2} />
          </span>
          <span className="font-display text-2xl leading-none text-forest-950">
            Sapling
          </span>
        </Link>

        <nav aria-label="Primary" className="mt-12 space-y-2">
          {destinations.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-forest-900 text-cream-50 shadow-md shadow-forest-900/10"
                    : "text-forest-900/65 hover:bg-white/70 hover:text-forest-950"
                }`}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {hasSupabase ? (
          <button
            className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-forest-900/60 transition hover:bg-white/70 hover:text-forest-950"
            onClick={signOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            Sign out
          </button>
        ) : null}
      </aside>

      <div className="min-w-0 pb-24 md:pb-0">
        <header className="flex items-center justify-between border-b border-forest-900/8 px-5 py-4 md:hidden">
          <Link href="/learn" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-forest-800 text-cream-50">
              <Leaf aria-hidden="true" size={18} />
            </span>
            <span className="font-display text-2xl text-forest-950">Sapling</span>
          </Link>
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

        <main>{children}</main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[22px] border border-forest-950/10 bg-forest-950/95 p-1.5 shadow-2xl shadow-forest-950/25 backdrop-blur-xl md:hidden"
      >
        {destinations.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[16px] px-1 py-2 text-[10px] font-semibold transition ${
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
