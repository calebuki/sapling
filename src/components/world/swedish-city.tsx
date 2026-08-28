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

      <nav
        aria-label="Places in Lindbacken"
        className="scrollbar-hidden absolute inset-x-3 bottom-24 z-10 flex gap-2 overflow-x-auto rounded-[18px] border border-white/55 bg-cream-50/78 p-2 shadow-xl shadow-forest-950/10 backdrop-blur-xl md:bottom-5 md:left-1/2 md:right-auto md:-translate-x-1/2"
      >
        {world.venues.map((venue) => {
          const recommended = venue.id === recommendedVenueId;
          return (
            <button
              aria-current={venue.id === selectedVenueId ? "true" : undefined}
              className={`flex min-w-max items-center gap-2 rounded-[13px] px-3 py-2 text-[11px] font-extrabold transition hover:bg-white focus-visible:bg-white ${
                recommended ? "bg-forest-950 text-cream-50" : "text-forest-950"
              }`}
              key={venue.id}
              onClick={() => onSelectVenue(venue.id)}
              type="button"
            >
              {recommended ? (
                <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-400" />
              ) : null}
              {venue.label}
            </button>
          );
        })}
      </nav>
    </section>
  );
}
