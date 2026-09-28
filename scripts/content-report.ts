// Authoring aid: how big each island's course is, and which words still need
// a hover gloss. Run with `npm run content:report -- de`.

import { coreText, extraText, missingGlosses } from "../src/content/audit";
import { loadIsland } from "../src/content/islands";
import { isTargetLanguageCode, type TargetLanguageCode } from "../src/lib/learning/languages";

const arg = process.argv[2] ?? "de";
if (!isTargetLanguageCode(arg)) throw new Error(`Unknown language ${arg}`);
const code: TargetLanguageCode = arg;
void main();

async function main() {
  const pack = await loadIsland(code);
  if (!pack) throw new Error(`${code} has no island yet`);

  const { course } = pack;
  console.log(`${code}: ${course.units.length} units, ${course.concepts.length} concepts, ${course.lessons.length} lessons, ${course.listenSpeakItems.length} listening items`);
  for (const level of ["A1", "A2"]) {
    console.log(`  ${level}: ${course.concepts.filter((c) => c.level === level).length} concepts`);
  }
  for (const unit of course.units) console.log(`  ${unit.level} ${unit.id.padEnd(16)} ${unit.villager.padEnd(8)} ${unit.slugs.length}`);

  const core = missingGlosses(pack, coreText(pack));
  const extra = missingGlosses(pack, extraText(pack)).filter(([word]) => !core.some(([w]) => w === word));
  console.log(`\nMissing glosses in lessons and UI (${core.length}):`);
  console.log(core.map(([w]) => w).join(" "));
  console.log(`\nMissing glosses in scenes and grammar (${extra.length}):`);
  console.log(extra.map(([w]) => w).join(" "));
}
