import type { LanguageWorld } from "@/lib/worlds/types";

export const swedishWorld: LanguageWorld = {
  id: "lindbacken",
  languageCode: "sv",
  name: "Lindbacken",
  venues: [
    {
      id: "sprakskolan",
      label: "Språkskolan",
      shortLabel: "Lär dig",
      kind: "learn",
      position: [-4.2, 0, -2.45],
      size: [2.7, 2.25, 2.25],
      wallColor: "#c8d7c0",
      roofColor: "#496856",
      accentColor: "#f4c97a",
      scenarioIds: [],
    },
    {
      id: "kafe-linden",
      label: "Kafé Linden",
      shortLabel: "Fika",
      kind: "practice",
      position: [3.8, 0, -2.15],
      size: [2.85, 1.95, 2.2],
      wallColor: "#e7c7ad",
      roofColor: "#9b5b4a",
      accentColor: "#f6dfa6",
      scenarioIds: ["fika-order", "meet-elin"],
    },
    {
      id: "centralstationen",
      label: "Centralstationen",
      shortLabel: "Resa",
      kind: "practice",
      position: [-3.35, 0, 3.15],
      size: [3.75, 1.55, 1.65],
      wallColor: "#d9d2bf",
      roofColor: "#65767d",
      accentColor: "#dca56a",
      scenarioIds: ["centralstation-change"],
    },
    {
      id: "stadsparken",
      label: "Stadsparken",
      shortLabel: "Planer",
      kind: "practice",
      position: [3.9, 0, 3.05],
      size: [3.15, 0.2, 2.7],
      wallColor: "#aac89e",
      roofColor: "#789a72",
      accentColor: "#e9b68b",
      scenarioIds: ["make-weekend-plans"],
    },
  ],
};

export function getWorldForLanguage(languageCode: string) {
  return languageCode === swedishWorld.languageCode ? swedishWorld : null;
}
