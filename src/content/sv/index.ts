import { createGlossary } from "@/lib/game/glossary";
import type { IslandPack } from "../types";
import { cafe } from "./cafe";
import { course } from "./course";
import { discoveries } from "./discoveries";
import { entries } from "./glossary";
import { grammarTips } from "./grammar";
import { placement } from "./placement";
import { scenarios } from "./scenarios";
import { drills, sceneExtras, scenes } from "./scenes";
import { ui } from "./ui";
import { elinAfterName, elinIntro, nudges, praise, roundDone, villagers } from "./villagers";
import { world } from "./world";

const { places, heightAt } = world;

export const island: IslandPack = {
  code: "sv",
  course,
  villagers,
  host: "elin",
  script: {
    intro: elinIntro,
    afterName: elinAfterName,
    praise,
    nudges,
    roundDone,
    stageNames: {
      0: { t: "okänd", en: "unknown" },
      1: { t: "frö", en: "seed" },
      2: { t: "grodd", en: "sprout" },
      3: { t: "planta", en: "sapling" },
      4: { t: "blomma", en: "in bloom" },
    },
  },
  ui,
  scenes,
  sceneExtras,
  drills,
  grammar: grammarTips,
  glossary: createGlossary("sv", entries),
  cafe,
  discoveries,
  world,
  scenery: "lilla-o",
  signs: [
    { id: "dock", line: { t: "Lilla Ö", en: "Little Island" }, x: -2.2, y: 2.9, z: 25.5 },
    { id: "ferry", line: { t: "Färjan", en: "The ferry" }, x: 5.7, y: 2.6, z: 37.6, far: 16 },
    { id: "cafe", line: { t: "Café Kanel", en: "Café Cinnamon" }, x: -13.7, y: heightAt(places.cafe.x, places.cafe.z) + 4.2, z: 1 },
    {
      id: "cafe-open",
      line: { t: "Öppet", en: "Open" },
      closedLine: { t: "Stängt", en: "Closed" },
      openWith: "bosse",
      x: -13.6,
      y: heightAt(places.cafe.x, places.cafe.z) + 1.8,
      z: 2.4,
      far: 12,
    },
    { id: "station", line: { t: "Stationen", en: "The station" }, x: 15.6, y: heightAt(places.station.x, places.station.z) + 3.9, z: -6.5 },
    { id: "garden", line: { t: "Astrids trädgård", en: "Astrid's garden" }, x: -0.5, y: heightAt(places.garden.x, places.garden.z) + 2.7, z: -14 },
  ],
  placement,
  scenarios,
};
