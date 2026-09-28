import type { PlacementConfig } from "@/lib/game/placement";

export const placement: PlacementConfig = {
  options: [
    { id: "new", title: { t: "Helt ny", en: "Brand new" }, detail: "I've never studied Swedish." },
    { id: "little", title: { t: "Lite grann", en: "A little" }, detail: "Duolingo section 1, or a few weeks of study. I know hej and tack." },
    { id: "some", title: { t: "En del", en: "Some" }, detail: "Duolingo sections 2–3. I can order at a café and introduce myself." },
    { id: "lots", title: { t: "Ganska mycket", en: "Quite a bit" }, detail: "Duolingo section 4 or beyond. I can ask for help and talk about plans." },
  ],
  bands: [0, 1, 2, 3],
  startBand: { little: 0, some: 1, lots: 2 },
};
