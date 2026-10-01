import { createGlossary } from "@/lib/game/glossary";
import type { IslandPack } from "../types";
import { cafe } from "./cafe";
import { clinic } from "./clinic";
import { clock } from "./clock";
import { ferry } from "./ferry";
import { market } from "./market";
import { forest } from "./forest";
import { course, courseGlosses } from "./course";
import { discoveries } from "./discoveries";
import { entries } from "./glossary";
import { grammarTips } from "./grammar";
import { home } from "./home";
import { placement } from "./placement";
import { scenarios } from "./scenarios";
import { drills, sceneExtras, scenes } from "./scenes";
import { ui } from "./ui";
import { afterName, intro, nudges, praise, roundDone, villagers } from "./villagers";
import { world } from "./world";

const { places, heightAt } = world;

export const island: IslandPack = {
  code: "de",
  course,
  villagers,
  host: "greta",
  script: {
    intro,
    afterName,
    praise,
    nudges,
    roundDone,
    stageNames: {
      0: { t: "unbekannt", en: "unknown" },
      1: { t: "Samen", en: "seed" },
      2: { t: "Keim", en: "sprout" },
      3: { t: "Setzling", en: "sapling" },
      4: { t: "Blüte", en: "in bloom" },
    },
  },
  ui,
  scenes,
  sceneExtras,
  drills,
  grammar: grammarTips,
  glossary: createGlossary("de", entries, courseGlosses),
  cafe,
  home,
  clinic,
  clock,
  ferry,
  market,
  forest,
  discoveries,
  world,
  scenery: "tannenau",
  theme: { fog: "#d3e3de", water: { shallow: "#a9e3d2", mid: "#5fb3a8", deep: "#2f7a86" } },
  flora: { pines: 95, rounds: 14, birches: 4, bushes: 34, rocks: 30, meadows: 150 },
  signs: [
    { id: "dock", line: { t: "Tannenau", en: "Fir Meadow" }, x: 2.4, y: 2.9, z: 25.5 },
    { id: "steamer", line: { t: "Der Dampfer", en: "The steamboat" }, x: 6.2, y: 3.2, z: 36.5, far: 16 },
    { id: "cafe", line: { t: "Café Kuckuck", en: "Cuckoo Café" }, x: -12.4, y: heightAt(places.bakery.x, places.bakery.z) + 5.2, z: 3 },
    {
      id: "cafe-open",
      line: { t: "Geöffnet", en: "Open" },
      closedLine: { t: "Geschlossen", en: "Closed" },
      openWith: "franz",
      x: -12.2,
      y: heightAt(places.bakery.x, places.bakery.z) + 1.8,
      z: 5.8,
      far: 12,
    },
    { id: "station", line: { t: "Bahnhof", en: "Station" }, x: 15.4, y: heightAt(places.station.x, places.station.z) + 5, z: -4.5 },
    { id: "clockmaker", line: { t: "Uhrmacherei", en: "Clockmaker" }, x: 11, y: heightAt(places.clockmaker.x, places.clockmaker.z) + 5.4, z: 15.4 },
    { id: "doctor", line: { t: "Arztpraxis", en: "Doctor's surgery" }, x: -11.6, y: heightAt(places.doctor.x, places.doctor.z) + 4.8, z: 16.4 },
    { id: "market", line: { t: "Markt", en: "Market" }, x: 5.8, y: heightAt(5.8, 10.5) + 3.2, z: 10.5 },
    { id: "farm", line: { t: "Hildes Hof", en: "Hilde's farm" }, x: -4.8, y: heightAt(places.farm.x, places.farm.z) + 3, z: -16.4 },
    { id: "forest", line: { t: "Forsthaus", en: "Forester's lodge" }, x: -21.5, y: heightAt(places.forest.x, places.forest.z) + 4, z: -5.4 },
    { id: "school", line: { t: "Schule", en: "School" }, x: 16.2, y: heightAt(places.school.x, places.school.z) + 4.2, z: -16.5 },
  ],
  placement,
  scenarios,
};
