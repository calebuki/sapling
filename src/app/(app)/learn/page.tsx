import { LearnSession } from "@/components/learn-session";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-10 pt-5 sm:px-8 sm:pb-14 sm:pt-7 lg:px-12">
      <div className="mb-5 inline-block rounded-[22px] border border-white/55 bg-cream-50/86 px-5 py-4 shadow-xl shadow-forest-950/12 backdrop-blur-xl sm:mb-7 sm:px-6">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">Learn</p>
        <h1 className="font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Make it come back.
        </h1>
      </div>
      <LearnSession />
    </div>
  );
}
