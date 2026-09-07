"use client";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { choosePracticeScenario } from "@/lib/practice/planner";
import {
  islandStorageKey,
  parseIslandActivity,
  type IslandActivity,
} from "@/lib/island/progression";
import IslandGame from "./island-game";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { IslandInvitations } from "./island-invitations";

const LearnSession = dynamic(
  () => import("@/components/learn-session").then((m) => m.LearnSession),
  { loading: () => <p role="status">Opening your lesson…</p> },
);
const PracticeSession = dynamic(
  () => import("@/components/practice-session").then((m) => m.PracticeSession),
  { loading: () => <p role="status">Elin is on her way…</p> },
);
const TownJournal = dynamic(
  () => import("@/components/town-journal").then((m) => m.TownJournal),
  { loading: () => <p role="status">Opening your journal…</p> },
);

export default function IslandHome() {
  const model = useLearningModel(),
    router = useRouter(),
    search = useSearchParams();
  const requested = parseIslandActivity(search.get("activity"));
  const activity = requested;
  const open = useCallback(
    (value: IslandActivity | null) => {
      router.replace(value ? `/?activity=${encodeURIComponent(value)}` : "/", {
        scroll: false,
      });
    },
    [router],
  );
  const recommended = useMemo(
    () =>
      choosePracticeScenario({
        languageCode: "sv",
        concepts: model.concepts,
        states: model.states,
        snapshot: model.practiceSnapshot,
      }).scenario.id,
    [model.concepts, model.states, model.practiceSnapshot],
  );
  if (model.isLoading || model.isSwitchingLanguage)
    return (
      <div className="island-loading" role="status">
        Sailing home…
      </div>
    );
  if (model.targetLanguage.code !== "sv") return null;
  const title =
    activity === "learn"
      ? "Språkverkstaden"
      : activity === "invitations"
        ? "Post till dig"
        : activity === "journal"
          ? "Din dagbok"
          : "En stund med Elin";
  return (
    <div className="sapling-island">
      <IslandGame
        key={model.learnerId}
        storageKey={islandStorageKey(model.learnerId)}
        activityOpen={!!activity}
        onActivity={open}
        recommended={recommended}
      />
      <Dialog
        open={!!activity}
        onOpenChange={(value) => {
          if (!value) open(null);
        }}
      >
        <DialogContent
          className={`island-activity ${activity === "invitations" ? "is-invitations" : ""}`}
          showCloseButton={false}
        >
          <header className="island-activity-header">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {activity === "learn"
                  ? "A little practice. More to do with it."
                  : activity === "invitations"
                    ? "Good company. A little Swedish. Something new to bring home."
                    : "Your island is right where you left it."}
              </DialogDescription>
            </div>
            <button className="island-return" onClick={() => open(null)}>
              ← Back to island
            </button>
          </header>
          <div className="island-activity-body">
            {activity === "learn" ? (
              <LearnSession />
            ) : activity === "invitations" ? (
              <IslandInvitations recommended={recommended} onOpen={open} />
            ) : activity === "journal" ? (
              <TownJournal />
            ) : activity ? (
              <PracticeSession
                scenarioIds={[activity]}
                onReturnToWorld={() => open(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
