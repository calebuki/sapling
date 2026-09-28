import type { TargetLanguageCode } from "@/lib/learning/languages";
import { normalizeText } from "@/lib/learning/text";
import type { Line } from "./line";
import type { SceneBeat } from "./scenes";

// A café counter: items on the menu board, orders that land on your tray, and
// the odd mix-up for you to fix. Each island brings its own menu and phrasing.

export type CafeIcon = "coffee" | "tea" | "water" | "milk" | "bun" | "pretzel" | "cake" | "juice";
export type CafeItem = { slug: string; name: string; en: string; price: number; icon: CafeIcon };

export type CafeConfig = {
  menu: CafeItem[];
  // Phrases that are ways of ordering; everything else is plain talk.
  orderSlugs: string[];
  // Everyday constructions the host also owns; they join once the menu is familiar.
  later: string[];
  // Several ways each order phrase comes up. Each variant is a complete right
  // answer; `accept` lets looser natural orders through.
  orderVariants: Record<string, Array<{ t: string; en: string; accept?: string[] }>>;
  // Spoken orders for the tray drill: listen to a customer, fill their tray.
  trayOrders: Array<{ t: string; en: string; items: string[] }>;
  // The host's side of an order and of the bill, so replies fit what you said.
  orderExchange: SceneBeat;
  billExchange: SceneBeat;
  billSlug: string;
  lines: {
    sorry: Line;
    served: Line;
    whatIsThis: Line;
    tapWhatYouHear: Line;
    howToOrder: Line;
    orderThis: Line;
    menu: Line;
    oops: Line;
  };
  // Nouns with the article a counter uses ("en kaffe", "ein Kaffee").
  withArticle(item: CafeItem): string;
  introduce(item: CafeItem): Line;
  price(item: CafeItem): Line;
  serve(item: CafeItem): Line;
  checkOrder(item: CafeItem): Line;
  // One right way to point out the mix-up, then two wrong ones.
  fixOptions(want: CafeItem, got: CafeItem, decoy: CafeItem): [Line, Line, Line];
};

export function cafeItem(config: CafeConfig, slug: string) {
  return config.menu.find((item) => item.slug === slug) ?? null;
}

// Menu items a (possibly half-built) order mentions, in the order they're said.
export function itemsIn(config: CafeConfig, text: string, code: TargetLanguageCode): CafeItem[] {
  const words = normalizeText(text, code).split(" ");
  return words.flatMap((word) =>
    config.menu.filter((item) => {
      const name = normalizeText(item.name, code);
      // German menus inflect a little ("einen Kaffee", "zwei Brezeln").
      return name === word || (code === "de" && word.startsWith(name) && word.length - name.length <= 2);
    }),
  );
}

// The host serves the wrong thing; the learner has to put it right.
export function mixUp(config: CafeConfig, want: CafeItem, seed: number) {
  const others = config.menu.filter((item) => item.slug !== want.slug);
  const got = others[seed % others.length];
  const decoy = others[(seed + 1) % others.length];
  const [right, thanks, wrong] = config.fixOptions(want, got, decoy);
  const options = [
    { ...right, right: true },
    { ...thanks, right: false },
    { ...wrong, right: false },
  ];
  return { got, serve: config.serve(got), options };
}
