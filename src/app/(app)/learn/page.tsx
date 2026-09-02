import { LearnSession } from "@/components/learn-session";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <h1 className="mb-5 font-display text-4xl leading-[1.03] text-forest-950 sm:mb-7 sm:text-5xl">Learn</h1>
      <LearnSession />
    </div>
  );
}
