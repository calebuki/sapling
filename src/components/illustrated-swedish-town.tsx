"use client";

import {
  Coffee,
  GraduationCap,
  MapPin,
  TrainFront,
  Trees,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import storybookImage from "@/assets/home/lindbacken-storybook.png";
import styles from "@/components/illustrated-swedish-town.module.css";
import type { LanguageWorld } from "@/lib/worlds/types";

const venuePresentation = {
  sprakskolan: { x: 28.5, y: 63, icon: GraduationCap },
  "kafe-linden": { x: 72, y: 76, icon: Coffee },
  centralstationen: { x: 35.5, y: 79, icon: TrainFront },
  stadsparken: { x: 51, y: 78.5, icon: Trees },
} as const;

export function IllustratedSwedishTown({
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
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth) {
      return;
    }

    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
  }, []);

  return (
    <section
      aria-label={`${world.name} illustrated interactive map`}
      className={styles.town}
    >
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.canvas}>
          <Image
            alt={`An illustrated view over ${world.name}`}
            className={styles.artwork}
            placeholder="blur"
            priority
            sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"
            src={storybookImage}
          />
          <div aria-hidden="true" className={styles.wash} />
          <div aria-hidden="true" className={styles.paper} />

          {world.venues.map((venue) => {
            const presentation =
              venuePresentation[venue.id as keyof typeof venuePresentation];
            if (!presentation) {
              return null;
            }

            const Icon = presentation.icon;
            const isRecommended = venue.id === recommendedVenueId;
            const isSelected = venue.id === selectedVenueId;

            return (
              <button
                aria-label={`${venue.label}: ${venue.shortLabel}${
                  isRecommended ? ", recommended" : ""
                }`}
                className={`${styles.venue} ${
                  isRecommended ? styles.recommended : ""
                } ${isSelected ? styles.selected : ""}`}
                disabled={selectedVenueId !== null}
                key={venue.id}
                onClick={() => onSelectVenue(venue.id)}
                style={{
                  left: `${presentation.x}%`,
                  top: `${presentation.y}%`,
                }}
                type="button"
              >
                <span aria-hidden="true" className={styles.pin}>
                  <Icon size={17} strokeWidth={2.3} />
                </span>
                <span className={styles.venueLabel}>
                  <strong>{venue.label}</strong>
                  <span>{venue.shortLabel}</span>
                </span>
                {isRecommended ? (
                  <span className={styles.recommendedLabel}>Nästa</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.titleBlock}>
        <p>
          <MapPin aria-hidden="true" size={13} />
          Svenska · din värld
        </p>
        <h1>{world.name}</h1>
        <span>Choose a place and step into Swedish.</span>
      </div>

      <div aria-hidden="true" className={styles.exploreHint}>
        <span />
        Drag to explore
      </div>
    </section>
  );
}
