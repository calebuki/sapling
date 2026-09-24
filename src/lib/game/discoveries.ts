// Things on the island the player can find and name. Finding one only records a
// local discovery; it never counts as mastery evidence in the learning model.

export type PropKind =
  | "none"
  | "rowboat"
  | "bucket"
  | "gull"
  | "cup"
  | "cat"
  | "mailbox"
  | "bike"
  | "clock"
  | "dog"
  | "moose"
  | "mushroom"
  | "strawberry"
  | "flower"
  | "appletree"
  | "stone"
  | "swing"
  | "birch";

export type Discovery = {
  id: string;
  sv: string;
  en: string;
  x: number;
  z: number;
  rot?: number;
  prop: PropKind;
  // Height of the label above the ground.
  lift: number;
  // Props that sit on furniture rather than the ground.
  y?: number;
};

export const discoveries: Discovery[] = [
  { id: "farja", sv: "en färja", en: "a ferry", x: 2.4, z: 38.5, prop: "none", lift: 3.2 },
  { id: "brygga", sv: "en brygga", en: "a dock / jetty", x: -1.2, z: 30, prop: "none", lift: 1.8 },
  { id: "fisk", sv: "en fisk", en: "a fish", x: 1, z: 33, prop: "bucket", lift: 1.6 },
  { id: "mas", sv: "en mås", en: "a seagull", x: -1.45, z: 36.5, prop: "gull", lift: 2.6 },
  { id: "bat", sv: "en båt", en: "a boat", x: -5, z: 28.6, rot: 0.6, prop: "rowboat", lift: 1.6 },
  { id: "lykta", sv: "en lykta", en: "a lantern", x: 1.6, z: 14, prop: "none", lift: 3 },
  { id: "bjork", sv: "en björk", en: "a birch tree", x: 5.5, z: 11, prop: "birch", lift: 4.8 },
  { id: "majstang", sv: "en midsommarstång", en: "a midsummer pole", x: 4.2, z: 2.2, prop: "none", lift: 6.2 },
  { id: "bank", sv: "en bänk", en: "a bench", x: -3.8, z: 8.4, prop: "none", lift: 1.8 },
  { id: "gunga", sv: "en gunga", en: "a swing", x: -7, z: -3.5, prop: "swing", lift: 3.6 },
  { id: "cykel", sv: "en cykel", en: "a bicycle", x: -8.6, z: 9, rot: 0.9, prop: "bike", lift: 1.8 },
  { id: "kopp", sv: "en kopp", en: "a cup", x: -10.3, z: 7.4, prop: "cup", lift: 2, y: 1.2 },
  { id: "katt", sv: "en katt", en: "a cat", x: -13.2, z: -3.4, rot: 1.2, prop: "cat", lift: 1.3 },
  { id: "brevlada", sv: "en brevlåda", en: "a mailbox", x: -8.2, z: 13.6, rot: 0.4, prop: "mailbox", lift: 2 },
  { id: "hus", sv: "ett hus", en: "a house", x: 9.2, z: 12.8, prop: "none", lift: 4.4 },
  { id: "hund", sv: "en hund", en: "a dog", x: 12.5, z: 5.5, rot: -2.2, prop: "dog", lift: 1.4 },
  { id: "klocka", sv: "en klocka", en: "a clock", x: 14.2, z: -5.2, prop: "none", lift: 3.7 },
  { id: "tag", sv: "ett tåg", en: "a train", x: 23.2, z: -2, prop: "none", lift: 3.6 },
  { id: "sten", sv: "en sten", en: "a stone / rock", x: -25, z: 3.5, prop: "stone", lift: 2.2 },
  { id: "alg", sv: "en älg", en: "a moose", x: -17.5, z: -17, rot: 0.8, prop: "moose", lift: 3.4 },
  { id: "svamp", sv: "en svamp", en: "a mushroom", x: -12.5, z: -23, prop: "mushroom", lift: 1.2 },
  { id: "blomma", sv: "en blomma", en: "a flower", x: -7.4, z: -12.6, prop: "flower", lift: 1.3 },
  { id: "jordgubbe", sv: "en jordgubbe", en: "a strawberry", x: 0.8, z: -18.2, prop: "strawberry", lift: 1.2 },
  { id: "appeltrad", sv: "ett äppelträd", en: "an apple tree", x: -9.5, z: -17.5, prop: "appletree", lift: 4.4 },
  { id: "flagga", sv: "en flagga", en: "a flag", x: 7.3, z: -23.4, prop: "none", lift: 7.4 },
];

export function getDiscovery(id: string) {
  return discoveries.find((item) => item.id === id);
}
