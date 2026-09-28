// A line of target-language text with its English meaning. Everything the
// island says is one of these; English only shows on hover or when asked for.
export type Line = { t: string; en: string };

export function pick<T>(items: readonly T[], seed = Math.random()) {
  return items[Math.floor(seed * items.length) % items.length];
}
