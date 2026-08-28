"use client";

import dynamic from "next/dynamic";

import type { LanguageWorld } from "@/lib/worlds/types";

const SwedishCityScene = dynamic(
  () =>
    import("@/components/world/swedish-city-scene").then(
      (module) => module.SwedishCityScene,
    ),
  {
    loading: () => (
      <div className="grid size-full place-items-center bg-[#dce7d8] text-xs font-bold text-forest-900/45">
        Lindbacken växer fram…
      </div>
    ),
    ssr: false,
  },
);

export function SwedishCity({
  world,
  recommendedVenueId,
  selectedVenueId,
  onSelectVenue,
}: {
  world: LanguageWorld;
  recommendedVenueId: string | null;
  selectedVenueId: string | null;
  onSelectVenue: (venueId: string) => void;
}) {
  return (
    <section
      aria-label={`${world.name} interactive map`}
      className="relative h-[calc(100dvh-5.2rem)] min-h-[34rem] overflow-hidden bg-[#dce7d8] md:h-dvh"
    >
      <SwedishCityScene
        onSelectVenue={onSelectVenue}
        recommendedVenueId={recommendedVenueId}
        selectedVenueId={selectedVenueId}
        venues={world.venues}
      />
    </section>
  );
}
