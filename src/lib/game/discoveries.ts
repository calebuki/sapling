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
  | "birch"
  | "cuckoo"
  | "pretzel"
  | "deer"
  | "hedgehog"
  | "cow"
  | "barrel"
  | "wheelbarrow"
  | "fir";

export type Discovery = {
  id: string;
  t: string;
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
