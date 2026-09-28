import type { PlacementConfig } from "@/lib/game/placement";

// Bands: first words and introductions; café, numbers, family and food;
// travel, time, shopping, home, directions and clothes; A2 plans to work;
// A2 the past to opinions. Bands 1–3 still start at Fika, Resan and Planer,
// so placements saved before the course grew keep their meaning.
export const placement: PlacementConfig = {
  options: [
    { id: "new", title: { t: "Helt ny", en: "Brand new" }, detail: "I've never studied Swedish." },
    { id: "little", title: { t: "Lite grann", en: "A little" }, detail: "Duolingo section 1, or a few weeks of study. I know hej and tack." },
    { id: "some", title: { t: "En del", en: "Some" }, detail: "Duolingo sections 2–3. I can order at a café, count and talk about my family." },
    { id: "lots", title: { t: "Ganska mycket", en: "Quite a bit" }, detail: "Duolingo section 4 or beyond. I can get around, shop and talk about plans." },
  ],
  bands: [0, 3, 7, 13, 18],
  startBand: { little: 0, some: 1, lots: 2 },
};
