import { LearnSession } from "@/components/learn-session";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mb-8">
        <h1 className="font-display text-5xl leading-none text-forest-950 sm:text-6xl">
          Make it come back.
        </h1>
      </div>
      <LearnSession />
    </div>
  );
}
