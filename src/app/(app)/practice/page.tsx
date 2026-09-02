import { PracticeView } from "@/components/practice-view";

export const metadata = { title: "Practice" };

type PracticeMode = "review" | "listening" | "text";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode: PracticeMode =
    mode === "listening" || mode === "text" ? mode : "review";

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
      <h1 className="mb-6 font-display text-4xl text-forest-950 sm:text-5xl">Practice</h1>
      <PracticeView initialMode={initialMode} />
    </div>
  );
}
