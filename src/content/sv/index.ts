import { createGlossary } from "@/lib/game/glossary";
import type { IslandPack } from "../types";
import { cafe } from "./cafe";
import { clinic } from "./clinic";
import { clock } from "./clock";
import { course, courseGlosses } from "./course";
import { discoveries } from "./discoveries";
import { entries } from "./glossary";
import { grammarTips } from "./grammar";
import { home } from "./home";
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
  glossary: createGlossary("sv", entries, courseGlosses),
  cafe,
  home,
  clinic,
  clock,
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
    { id: "boathouse", line: { t: "Sjöboden", en: "The boathouse" }, x: 12.3, y: heightAt(places.boathouse.x, places.boathouse.z) + 3.4, z: 26 },
    { id: "shop", line: { t: "Lanthandeln", en: "The village shop" }, x: -8.6, y: heightAt(places.shop.x, places.shop.z) + 4, z: 15.9 },
    {
      id: "shop-open",
      line: { t: "Öppet", en: "Open" },
      closedLine: { t: "Stängt", en: "Closed" },
      openWith: "maja",
      x: -8.6,
      y: heightAt(places.shop.x, places.shop.z) + 1.9,
      z: 17.2,
      far: 12,
    },
    { id: "health", line: { t: "Vårdcentralen", en: "The health centre" }, x: -17.4, y: heightAt(places.health.x, places.health.z) + 3.8, z: 12.8 },
    { id: "library", line: { t: "Biblioteket", en: "The library" }, x: -11.6, y: heightAt(places.library.x, places.library.z) + 4, z: -9.4 },
    { id: "lighthouse", line: { t: "Fyren", en: "The lighthouse" }, x: 1.6, y: heightAt(places.lighthouse.x, places.lighthouse.z) + 2.9, z: -30.4 },
  ],
  placement,
  scenarios,
};
