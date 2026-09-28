import type { PlacementConfig } from "@/lib/game/placement";

// Bands: first words; café and numbers; family, food and help; getting
// around and time; shopping, home and directions; A2 weather to work; A2 past
// to opinions.
export const placement: PlacementConfig = {
  options: [
    { id: "new", title: { t: "Ganz neu", en: "Brand new" }, detail: "I've never studied German." },
    { id: "little", title: { t: "Ein bisschen", en: "A little" }, detail: "Duolingo section 1, or a few weeks of study. I know hallo and danke." },
    { id: "some", title: { t: "Einiges", en: "Some" }, detail: "Duolingo sections 2–3. I can order in a café, count and talk about my family." },
    { id: "lots", title: { t: "Ziemlich viel", en: "Quite a bit" }, detail: "Duolingo section 4 or beyond. I can talk about my day, the past and my plans." },
  ],
  bands: [0, 2, 4, 7, 9, 13, 17],
  startBand: { little: 0, some: 2, lots: 4 },
};
