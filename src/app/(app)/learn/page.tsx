import { LearnSession } from "@/components/learn-session";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <div className="mb-5 sm:mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">Learn</p>
        <h1 className="font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Make it come back.
        </h1>
      </div>
      <LearnSession />
    </div>
  );
}
