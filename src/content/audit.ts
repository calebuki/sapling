import { wordParts } from "@/lib/game/glossary";
import type { IslandPack } from "./types";

// Content checks shared by the tests and the authoring report
// (scripts/content-report.ts): what an island shows, and which words in it
// have no hover gloss yet.

// Everything the island shows outside of scenes and grammar tips.
export function coreText(pack: IslandPack) {
  const texts: string[] = [];
  for (const lesson of pack.course.lessons) {
    for (const exercise of lesson.exercises) texts.push(exercise.expected);
    for (const word of [...(lesson.support?.words ?? []), ...(lesson.support?.starters ?? [])]) texts.push(word.target);
  }
  for (const item of pack.course.listenSpeakItems) texts.push(item.text);
  for (const unit of pack.course.units) texts.push(unit.title.t);
  for (const scenario of pack.scenarios) {
    texts.push(scenario.openingLine, ...scenario.starterHints.map((h) => h.target), ...scenario.fallbackReplies.map((h) => h.target));
  }
  for (const v of pack.villagers) {
    for (const line of [v.role, v.place, v.locked, v.teach, v.talk, ...v.greetings, ...v.chatter, ...v.goodbye]) texts.push(line.t);
  }
  const { script } = pack;
  for (const line of [...script.intro, ...script.afterName("Kim"), ...script.praise, ...script.nudges, ...script.roundDone, ...Object.values(script.stageNames)]) {
    texts.push(line.t);
  }
  for (const item of pack.discoveries) texts.push(item.t);
  for (const sign of pack.signs) texts.push(sign.line.t, sign.closedLine?.t ?? "");
  for (const [key, value] of Object.entries(pack.ui)) {
    if (typeof value !== "function") texts.push(value.t);
    else if (key === "wordGrows") texts.push(pack.ui.wordGrows(script.stageNames[3]).t);
    else texts.push((value as (name: string, place: { t: string; en: string }) => { t: string })("Kim", pack.villagers[0].place).t);
  }
  if (pack.cafe) {
    const { cafe } = pack;
    for (const item of cafe.menu) texts.push(item.name, cafe.introduce(item).t, cafe.serve(item).t, cafe.checkOrder(item).t, cafe.price(item).t);
    for (const line of Object.values(cafe.lines)) texts.push(line.t);
    for (const variants of Object.values(cafe.orderVariants)) texts.push(...variants.map((v) => v.t));
    texts.push(...cafe.trayOrders.map((o) => o.t));
    const [a, b, c] = cafe.menu;
    texts.push(...cafe.fixOptions(a, b, c).map((o) => o.t));
  }
  return texts;
}

// Scene exchanges and grammar tips: shown too, but a word missing here falls
// back to an on-demand gloss instead of breaking a lesson.
export function extraText(pack: IslandPack) {
  const texts: string[] = [];
  for (const beats of Object.values(pack.scenes)) {
    for (const variants of Object.values(beats)) {
      for (const beat of variants) {
        texts.push(beat.cue.t, beat.reaction.t, beat.expect?.t ?? "", ...(beat.branches ?? []).map((b) => b.reaction.t));
      }
    }
  }
  const extras = pack.sceneExtras;
  texts.push(...Object.values(extras.lines).map((l) => l.t), extras.nameTag, extras.track.t);
  texts.push(...extras.announcements.map((a) => a.t), ...extras.signs.map((s) => s.line.t), ...extras.whereQuestions.map((q) => q.t));
  texts.push(...Object.values(extras.whenSentences).flatMap((s) => s.map((x) => x.t)), ...extras.calendar.map((c) => c.line.t));
  for (const tip of pack.grammar) {
    texts.push(tip.title.t, ...tip.cards.flatMap((c) => [c.title.t, ...c.examples.map((e) => e.t)]), ...tip.check.options);
  }
  return texts;
}

export function missingGlosses(pack: IslandPack, texts: string[], ignore: readonly string[] = ["Kim"]) {
  const missing = new Map<string, number>();
  const knows = (word: string) => Boolean(pack.glossary.lookup(word));
  for (const text of texts) {
    // Placeholders ({name}, {n}) are filled in at runtime.
    for (const word of wordParts(text.replace(/\{\w+\}/g, ""), pack.code, knows).filter((_, i) => i % 2 === 1)) {
      if (!ignore.includes(word) && !pack.glossary.lookup(word)) missing.set(word, (missing.get(word) ?? 0) + 1);
    }
  }
  return [...missing.entries()].sort((a, b) => b[1] - a[1]);
}
