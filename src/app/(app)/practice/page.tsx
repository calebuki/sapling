import { PracticeHome } from "@/components/practice-home";

export const metadata = { title: "Practice" };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string }>;
}) {
  const { scene } = await searchParams;
  return <PracticeHome initialScenarioId={scene} />;
}
