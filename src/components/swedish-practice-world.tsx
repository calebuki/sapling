"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseIslandActivity } from "@/lib/island/progression";
export function SwedishPracticeWorld({
  initialScenarioId,
}: {
  embedded?: boolean;
  initialScenarioId?: string;
}) {
  const router = useRouter();
  const activity =
    parseIslandActivity(initialScenarioId ?? null) ?? "invitations";
  useEffect(() => {
    router.replace("/?activity=" + activity);
  }, [router, activity]);
  return (
    <div className="island-loading" role="status">
      Sailing to your next adventure…
    </div>
  );
}
