import { createGlossary } from "@/lib/game/glossary";
import type { IslandPack } from "../types";
import { course, courseGlosses } from "./course";
import { discoveries } from "./discoveries";
import { entries } from "./glossary";
import { grammarTips } from "./grammar";
import { placement } from "./placement";
import { scenarios } from "./scenarios";
import { drills, sceneExtras, scenes } from "./scenes";
import { ui } from "./ui";
import { afterName, intro, nudges, praise, roundDone, villagers } from "./villagers";
import { world } from "./world";

const { places, heightAt } = world;

export const island: IslandPack = {
  code: "vi",
  course,
  villagers,
  host: "lan",
  script: {
    intro,
    afterName,
    praise,
    nudges,
    roundDone,
    stageNames: {
      0: { t: "chưa biết", en: "unknown" },
      1: { t: "hạt", en: "seed" },
      2: { t: "mầm", en: "sprout" },
      3: { t: "cây non", en: "sapling" },
      4: { t: "nở hoa", en: "in bloom" },
    },
  },
  ui,
  scenes,
  sceneExtras,
  drills,
  grammar: grammarTips,
  glossary: createGlossary("vi", entries, courseGlosses),
  cafe: null,
  discoveries,
  world,
  scenery: "cat-ba",
  // Emerald bay water under a soft, misty Hạ Long haze.
  theme: { fog: "#d5e4dc", water: { shallow: "#9fe0cc", mid: "#4fae9c", deep: "#237a78" } },
  flora: { pines: 0, rounds: 70, birches: 0, bushes: 60, rocks: 34, meadows: 140 },
  signs: [
    { id: "dock", line: { t: "Bến thuyền Cát Bà", en: "Cát Bà boat landing" }, x: 2.4, y: 2.9, z: 25.5 },
    { id: "pho", line: { t: "Phở Hùng", en: "Hùng's pho" }, x: -12.2, y: heightAt(places.pho.x, places.pho.z) + 4.4, z: 6.8 },
    {
      id: "pho-open",
      line: { t: "Mở cửa", en: "Open" },
      closedLine: { t: "Đóng cửa", en: "Closed" },
      openWith: "hung",
      x: -11.8,
      y: heightAt(places.pho.x, places.pho.z) + 1.8,
      z: 4.2,
      far: 12,
    },
    { id: "market", line: { t: "Chợ", en: "Market" }, x: 11.4, y: heightAt(places.market.x, places.market.z) + 3.6, z: 3.2 },
    { id: "house", line: { t: "Nhà ông Sơn", en: "Ông Sơn's house" }, x: 12, y: heightAt(places.house.x, places.house.z) + 3.8, z: 18.8 },
    { id: "pagoda", line: { t: "Chùa", en: "Pagoda" }, x: 3.2, y: heightAt(places.pagoda.x, places.pagoda.z) + 6.4, z: -21.8 },
    { id: "forest", line: { t: "Vườn quốc gia", en: "National park" }, x: -18.4, y: heightAt(places.forest.x, places.forest.z) + 3.4, z: -8.6 },
  ],
  placement,
  scenarios,
};
