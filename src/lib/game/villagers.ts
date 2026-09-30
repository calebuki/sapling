import type { Line } from "./line";

// Villagers are the only way learning reaches the player: each one teaches a
// few units of the course and has one live-conversation scenario.

export type VillagerId = string;

export type CharacterLook = {
  skin: string;
  hair: string;
  hairStyle: "bob" | "braid" | "short" | "bun" | "beanie";
  shirt: string;
  pants: string;
  accent: string;
  hat?: "conductor" | "sunhat" | "chef" | "beanie" | "cap" | "bollenhut" | "nonla" | "pith";
  beard?: boolean;
  apron?: string;
  scale?: number;
};

export type Villager = {
  id: VillagerId;
  name: string;
  role: Line;
  place: Line;
  scenarioId: string | null;
  // How lessons play out: at a café counter, or through little exchanges.
  round: "cafe" | "scene";
  // The panel above scene lessons.
  stage: "guestbook" | "journey" | "garden" | "stamps";
  position: [number, number];
  facing: number;
  look: CharacterLook;
  voicePitch: number;
  // A neural voice name from the allowlist in ./voices.
  voice: string;
  // Where they are, for the model that writes their replies.
  context: string;
  greetings: Line[];
  chatter: Line[];
  locked: Line;
  teach: Line;
  talk: Line;
  goodbye: Line[];
};
