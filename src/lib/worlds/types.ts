export type WorldVenueKind = "learn" | "practice";

export type WorldVenue = {
  id: string;
  label: string;
  shortLabel: string;
  kind: WorldVenueKind;
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  wallColor: string;
  roofColor: string;
  accentColor: string;
  scenarioIds: readonly string[];
};

export type LanguageWorld = {
  id: string;
  languageCode: string;
  name: string;
  venues: readonly WorldVenue[];
};
