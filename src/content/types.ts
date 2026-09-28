import type { CafeConfig } from "@/lib/game/cafe";
import type { Discovery } from "@/lib/game/discoveries";
import type { Glossary } from "@/lib/game/glossary";
import type { GrammarTip } from "@/lib/game/grammar";
import type { Line } from "@/lib/game/line";
import type { PlacementConfig } from "@/lib/game/placement";
import type { Stage } from "@/lib/game/progression";
import type { DrillKind, SceneBeat, SceneExtras } from "@/lib/game/scenes";
import type { UiText } from "@/lib/game/ui-text";
import type { Villager, VillagerId } from "@/lib/game/villagers";
import type { World } from "@/lib/game/world";
import type { Course } from "@/lib/learning/course";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { PracticeScenario } from "@/types/practice";

// Everything one island needs: its course, its people, the words they say and
// the ground they stand on. The game engine never names a language; it plays
// whichever pack it is handed.

export type WorldSign = {
  id: string;
  line: Line;
  x: number;
  y: number;
  z: number;
  far?: number;
  // Signs that change once a villager opens up ("Stängt" → "Öppet").
  openWith?: VillagerId;
  closedLine?: Line;
};

export type IslandPack = {
  code: TargetLanguageCode;
  course: Course;
  villagers: Villager[];
  // Who greets new arrivals and asks their name.
  host: VillagerId;
  script: {
    intro: Line[];
    afterName(name: string): Line[];
    praise: Line[];
    nudges: Line[];
    roundDone: Line[];
    stageNames: Record<Stage, Line>;
  };
  ui: UiText;
  scenes: Record<VillagerId, Record<string, SceneBeat[]>>;
  sceneExtras: SceneExtras;
  drills: Record<string, DrillKind>;
  grammar: GrammarTip[];
  glossary: Glossary;
  cafe: CafeConfig | null;
  discoveries: Discovery[];
  world: World;
  scenery: "lilla-o" | "tannenau";
  signs: WorldSign[];
  placement: PlacementConfig;
  scenarios: PracticeScenario[];
};
