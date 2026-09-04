"use client";

import { ArrowLeft, Leaf, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { PracticeSession } from "@/components/practice-session";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import { useUiSounds } from "@/components/providers/ui-sound-provider";
import { SwedishCity } from "@/components/world/swedish-city";
import { choosePracticeScenario } from "@/lib/practice/planner";
import { swedishWorld } from "@/lib/worlds/swedish";

export function SwedishPracticeWorld({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { playSound } = useUiSounds();
  const { concepts, states, practiceSnapshot, targetLanguage } = useLearningModel();
  const [enteringVenueId, setEnteringVenueId] = useState<string | null>(null);
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  const entryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recommendation = useMemo(
    () =>
      choosePracticeScenario({
        languageCode: targetLanguage.code,
        concepts,
        states,
        snapshot: practiceSnapshot,
      }),
    [concepts, practiceSnapshot, states, targetLanguage.code],
  );
  const recommendedVenueId =
    swedishWorld.venues.find((venue) =>
      venue.scenarioIds.includes(recommendation.scenario.id),
    )?.id ?? "kafe-linden";
  const activeVenue =
    swedishWorld.venues.find((venue) => venue.id === activeVenueId) ?? null;

  useEffect(
    () => () => {
      if (entryTimer.current) {
        clearTimeout(entryTimer.current);
      }
    },
    [],
  );

  function selectVenue(venueId: string) {
    if (enteringVenueId) {
      return;
    }
    const venue = swedishWorld.venues.find((candidate) => candidate.id === venueId);
    if (!venue) {
      return;
    }

    setEnteringVenueId(venue.id);
    playSound("advance");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    entryTimer.current = setTimeout(
      () => {
        if (venue.kind === "learn") {
          router.push("/learn");
          return;
        }
        setActiveVenueId(venue.id);
        setEnteringVenueId(null);
      },
      reduceMotion ? 0 : 720,
    );
  }

  if (activeVenue) {
    return (
      <div className="interaction-stage mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
        <button
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-extrabold text-forest-900/58 transition hover:bg-white/60 hover:text-forest-950"
          onClick={() => setActiveVenueId(null)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Tillbaka till Lindbacken
        </button>
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700/65">
              <MapPin aria-hidden="true" size={13} />
              {activeVenue.label}
            </p>
            <h1 className="font-display text-4xl leading-[1.03] text-forest-950 sm:text-5xl">
              Use what you know.
            </h1>
          </div>
        </div>
        <PracticeSession
          onReturnToWorld={() => setActiveVenueId(null)}
          scenarioIds={activeVenue.scenarioIds}
        />
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "relative"
          : "relative -mb-[calc(7rem+env(safe-area-inset-bottom))] md:mb-0"
      }
    >
      <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-[16rem] sm:left-8 sm:top-8 sm:max-w-sm lg:left-12 lg:top-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-cream-50/78 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-forest-800 shadow-sm backdrop-blur-xl">
          <Leaf aria-hidden="true" size={13} />
          Svenska
        </div>
        <h1 className="mt-3 font-display text-4xl leading-[0.95] text-forest-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] sm:text-6xl">
          Lindbacken
        </h1>
        <p className="mt-3 hidden max-w-xs text-sm font-bold leading-6 text-forest-900/58 sm:block">
          Choose a place and step into Swedish.
        </p>
      </div>

      <SwedishCity
        onSelectVenue={selectVenue}
        recommendedVenueId={recommendedVenueId}
        selectedVenueId={enteringVenueId}
        world={swedishWorld}
      />

      {enteringVenueId ? (
        <div className="venue-enter-overlay pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-forest-950/8 pt-5 backdrop-blur-[2px]">
          <div className="rounded-full bg-forest-950/88 px-4 py-2 text-xs font-extrabold text-cream-50 shadow-xl backdrop-blur-lg">
            Går in…
          </div>
        </div>
      ) : null}
    </div>
  );
}
