"use client";

import {
  Ear,
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
import { useLearningModel } from "@/components/providers/learning-model-provider";

const destinations = [
  { href: "/learn", label: "Learn", icon: Sprout },
  { href: "/ear", label: "Ear", icon: Ear },
  { href: "/my-danish", label: "My Danish", icon: TreePine },
  { href: "/world", label: "World", icon: MessageCircle },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useLearningModel();

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
          <span>
            <span className="block font-display text-2xl leading-none text-forest-950">
              Sapling
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-forest-700/60">
              Dansk, every day
            </span>
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

        <div className="mt-auto rounded-2xl border border-forest-900/10 bg-white/55 p-3 text-xs text-forest-900/60">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  mode === "supabase" ? "bg-moss-500" : "bg-amber-500"
                }`}
              />
              {mode === "supabase" ? "Synced" : "Local model"}
            </span>
            {hasSupabase ? (
              <button
                aria-label="Sign out"
                className="rounded-lg p-1.5 transition hover:bg-forest-900/5 hover:text-forest-950"
                onClick={signOut}
                type="button"
              >
                <LogOut aria-hidden="true" size={15} />
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-0">
        <header className="flex items-center justify-between border-b border-forest-900/8 px-5 py-4 md:hidden">
          <Link href="/learn" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-forest-800 text-cream-50">
              <Leaf aria-hidden="true" size={18} />
            </span>
            <span className="font-display text-2xl text-forest-950">Sapling</span>
          </Link>
          <span className="rounded-full border border-forest-900/10 bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-forest-800/60">
            {mode === "supabase" ? "Synced" : "Local"}
          </span>
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
