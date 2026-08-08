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
    <div className="mx-auto min-h-dvh w-full max-w-[1720px] md:grid md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-forest-950/8 bg-cream-50/72 px-5 py-6 backdrop-blur-xl md:flex">
        <Link href="/learn" className="flex items-center gap-3 rounded-2xl px-2 py-1">
          <span className="grid size-10 place-items-center rounded-[14px] bg-forest-950 text-cream-50 shadow-lg shadow-forest-950/12">
            <Leaf aria-hidden="true" size={20} strokeWidth={2.4} />
          </span>
          <span className="text-xl font-extrabold leading-none tracking-[-0.045em] text-forest-950">
            Sapling
          </span>
        </Link>

        <nav aria-label="Primary" className="mt-11 space-y-1.5">
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

        {hasSupabase ? (
          <button
            className="mt-auto flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[13px] font-bold text-forest-900/58 transition hover:bg-white/75 hover:text-forest-950"
            onClick={signOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            Sign out
          </button>
        ) : null}
      </aside>

      <div className="min-w-0 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-forest-950/8 bg-cream-100/88 px-5 py-3.5 backdrop-blur-xl md:hidden">
          <Link href="/learn" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-forest-950 text-cream-50">
              <Leaf aria-hidden="true" size={18} />
            </span>
            <span className="text-xl font-extrabold tracking-[-0.045em] text-forest-950">Sapling</span>
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
        className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-4 rounded-[20px] border border-forest-950/10 bg-forest-950/96 p-1.5 shadow-2xl shadow-forest-950/24 backdrop-blur-xl md:hidden"
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
