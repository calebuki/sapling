"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PracticeSession } from "@/components/practice-session";
import { TownHome } from "@/components/town-home";
import { getTownQuest } from "@/lib/worlds/quests";

export function SwedishPracticeWorld({
  initialScenarioId,
}: {
  embedded?: boolean;
  initialScenarioId?: string;
}) {
  const quest = initialScenarioId ? getTownQuest(initialScenarioId) : undefined;
  if (!quest) return <TownHome />;
  return (
    <div className="life-page life-scene-page">
      <Link className="life-text-link life-back-link" href="/practice">
        <ArrowLeft size={16} />
        Back to Lindbacken
      </Link>
      <PracticeSession key={quest.id} scenarioIds={[quest.id]} />
    </div>
  );
}
