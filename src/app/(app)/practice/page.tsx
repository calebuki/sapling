import { PracticeSession } from "@/components/practice-session";

export const metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <div className="mb-5 sm:mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">
          Practice
        </p>
        <h1 className="font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
          Use what you know.
        </h1>
      </div>
      <PracticeSession />
    </div>
  );
}
