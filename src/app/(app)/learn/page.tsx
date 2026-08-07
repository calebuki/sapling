import { LearnSession } from "@/components/learn-session";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest-700/55">
            Fredag · today’s practice
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none text-forest-950 sm:text-6xl">
            Make it come back.
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-forest-900/55">
          A short session chosen to retrieve, compare, repair, and transfer—not
          to fill a progress bar.
        </p>
      </div>
      <LearnSession />
    </div>
  );
}

