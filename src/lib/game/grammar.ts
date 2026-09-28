import type { Line } from "./line";

// Short grammar lessons, taught by the villager whose unit needs them. A tip
// opens once enough of its unit's phrases have been met, and the phrases it
// gates stay out of lessons until the tip has been read.

export type GrammarCard = {
  title: Line;
  // Plain-English explanation: grammar is the one place English leads.
  body: string;
  examples: Line[];
};

export type GrammarTip = {
  id: string;
  unit: string;
  title: Line;
  readyAt: number;
  gates: string[];
  cards: GrammarCard[];
  check: { question: string; options: string[]; answer: string; why: string };
};

// The next tip one of these units should teach before a lesson, if any.
export function pendingTip(tips: readonly GrammarTip[], units: ReadonlyArray<{ id: string; met: number }>, seen: readonly string[]) {
  for (const unit of units) {
    const tip = tips.find((t) => t.unit === unit.id && !seen.includes(t.id) && unit.met >= t.readyAt);
    if (tip) return tip;
  }
  return null;
}

// Phrases that stay out of lessons until their tip has been read.
export function gatedSlugs(tips: readonly GrammarTip[], seen: readonly string[]) {
  return new Set(tips.filter((tip) => !seen.includes(tip.id)).flatMap((tip) => tip.gates));
}
