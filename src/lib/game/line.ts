// A line of target-language text with its English meaning. Everything the
// island says is one of these; English only shows on hover or when asked for.
//
// A long line made of interchangeable pieces (a recipe, "no, that's my eye!
// my head hurts") can be spoken as `parts`: short clips played one after
// another, so each piece is recorded once and reused. `t` is then exactly the
// parts joined with spaces.
export type Line = { t: string; en: string; parts?: readonly string[] };

export function spoken(parts: readonly string[], en: string): Line {
  return { t: parts.join(" "), en, parts };
}

export function pick<T>(items: readonly T[], seed = Math.random()) {
  return items[Math.floor(seed * items.length) % items.length];
}
