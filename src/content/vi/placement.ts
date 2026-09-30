import type { PlacementConfig } from "@/lib/game/placement";

// Bands: greetings; introductions; food and drink; the market and numbers;
// family.
export const placement: PlacementConfig = {
  options: [
    { id: "new", title: { t: "Hoàn toàn mới", en: "Brand new" }, detail: "I've never studied Vietnamese." },
    { id: "little", title: { t: "Một chút", en: "A little" }, detail: "A few weeks of study. I know xin chào and cảm ơn." },
    { id: "some", title: { t: "Khá nhiều", en: "Some" }, detail: "I can introduce myself and order phở." },
    { id: "lots", title: { t: "Nhiều", en: "Quite a bit" }, detail: "I can count, haggle at the market and talk about my family." },
  ],
  bands: [0, 1, 2, 3, 4],
  startBand: { little: 0, some: 1, lots: 3 },
};
