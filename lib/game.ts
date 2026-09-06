export const ITEMS = {
  wood: {
    name: 'Wood',
    sv: 'trä',
    plural: 'trä',
    icon: '🪵',
    unit: 'en',
    many: 'bitar trä',
  },
  apple: {
    name: 'Apple',
    sv: 'äpple',
    plural: 'äpplen',
    icon: '🍎',
    unit: 'ett',
    many: 'äpplen',
  },
  stone: {
    name: 'Stone',
    sv: 'sten',
    plural: 'stenar',
    icon: '🪨',
    unit: 'en',
    many: 'stenar',
  },
  flower: {
    name: 'Flower',
    sv: 'blomma',
    plural: 'blommor',
    icon: '🌼',
    unit: 'en',
    many: 'blommor',
  },
  chair: {
    name: 'Chair',
    sv: 'stol',
    plural: 'stolar',
    icon: '🪑',
    unit: 'en',
    many: 'stolar',
  },
  table: {
    name: 'Table',
    sv: 'bord',
    plural: 'bord',
    icon: '🛠️',
    unit: 'ett',
    many: 'bord',
  },
  planter: {
    name: 'Flowerpot',
    sv: 'blomkruka',
    plural: 'blomkrukor',
    icon: '🪴',
    unit: 'en',
    many: 'blomkrukor',
  },
} as const;
export type Item = keyof typeof ITEMS;
export type Inventory = Record<Item, number>;
export const emptyBag = (): Inventory => ({
  wood: 0,
  apple: 0,
  stone: 0,
  flower: 0,
  chair: 0,
  table: 0,
  planter: 0,
});
export const RECIPES: Record<
  string,
  { cost: Partial<Inventory>; unlock: number }
> = {
  chair: { cost: { wood: 3 }, unlock: 0 },
  planter: { cost: { stone: 2, flower: 2 }, unlock: 2 },
  table: { cost: { wood: 5, stone: 2 }, unlock: 4 },
};
export type Token = { sv: string; en: string; key: string };
export type Request = {
  visitor: string;
  role: string;
  tokens: Token[];
  needs: Partial<Inventory>;
  reward: number;
};
const t = (sv: string, en: string, key = sv.toLowerCase()): Token => ({
  sv,
  en,
  key,
});
function noun(id: Item, n: number): Token[] {
  const a = ITEMS[id];
  if (id === 'wood')
    return [
      t(['', 'en', 'två', 'tre'][n], ['', 'one', 'two', 'three'][n], `n${n}`),
      t(n === 1 ? 'bit' : 'bitar', 'piece' + (n === 1 ? '' : 's'), 'bit'),
      t('trä', 'wood', 'wood'),
    ];
  return [
    t(
      n === 1 ? a.unit : n === 2 ? 'två' : 'tre',
      n === 1 ? 'a' : n === 2 ? 'two' : 'three',
      `n${n}`,
    ),
    t(
      n === 1 ? a.sv : a.plural,
      n === 1 ? a.name.toLowerCase() : a.name.toLowerCase() + 's',
      id,
    ),
  ];
}
export function makeRequest(completed: number, cycle = 0): Request {
  const tier = completed < 2 ? 0 : completed < 5 ? 1 : 2;
  const pool: Item[] =
    tier === 0
      ? ['apple', 'flower', 'wood', 'stone']
      : tier === 1
        ? ['chair', 'apple', 'stone', 'flower', 'planter']
        : ['table', 'planter', 'chair', 'apple', 'flower', 'wood'];
  const index = (completed + cycle) % pool.length,
    id = pool[index],
    n = completed === 0 ? 1 : 1 + ((completed + cycle) % 3),
    count = id === 'table' || id === 'planter' || id === 'chair' ? 1 : n;
  const people = [
    ['Elsa', 'Your neighbor'],
    ['Nils', 'The gardener'],
    ['Maja', 'From the next island'],
    ['Otto', 'The boatbuilder'],
  ];
  const [visitor, role] = people[(completed + cycle) % 4];
  let tokens: Token[];
  const ns = noun(id, count);
  switch ((completed + cycle) % 4) {
    case 0:
      tokens = [
        t('Jag', 'I'),
        t('behöver', 'need'),
        ...ns,
        t('tack.', 'please', 'tack'),
      ];
      break;
    case 1:
      tokens = [
        t('Kan', 'Can'),
        t('du', 'you'),
        t('ge', 'give'),
        t('mig', 'me'),
        ...ns,
      ];
      tokens[tokens.length - 1] = {
        ...tokens[tokens.length - 1],
        sv: tokens[tokens.length - 1].sv + '?',
      };
      break;
    case 2:
      tokens = [
        t('Jag', 'I'),
        t('vill', 'want'),
        t('ha', 'to have'),
        ...ns,
        t('tack.', 'please', 'tack'),
      ];
      break;
    default:
      tokens = [t('Har', 'Have'), t('du', 'you'), ...ns];
      tokens[tokens.length - 1] = {
        ...tokens[tokens.length - 1],
        sv: tokens[tokens.length - 1].sv + '?',
      };
  }
  const needs: Partial<Inventory> = { [id]: count };
  if (completed >= 8 && (completed + cycle) % 3 === 0) {
    const extra: Item = id === 'apple' ? 'flower' : 'apple';
    needs[extra] = 2;
    tokens = tokens
      .map((v) => ({ ...v, sv: v.sv.replace(/[.?]/g, '') }))
      .filter((v) => v.key !== 'tack');
    tokens.push(
      t('och', 'and'),
      ...noun(extra, 2),
      t('tack.', 'please', 'tack'),
    );
  }
  return {
    visitor,
    role,
    tokens,
    needs,
    reward: 8 + count * 3 + (RECIPES[id] ? 8 : 0),
  };
}
export type Word = {
  sv: string;
  en: string;
  encounters: number;
  successes: number;
  help: number;
};
export type Decoration = { id: string; kind: Item; x: number; z: number };
export type State = {
  version: 1;
  bag: Inventory;
  coins: number;
  completed: number;
  cycle: number;
  words: Record<string, Word>;
  decorations: Decoration[];
  mode: 'guided' | 'listening' | 'immersive';
  sound: boolean;
  welcomed: boolean;
  requestHelp: boolean;
  helpedKeys: string[];
  heard: boolean;
  cooldowns: Partial<Record<Item, number>>;
};
export const initialState = (): State => ({
  version: 1,
  bag: emptyBag(),
  coins: 0,
  completed: 0,
  cycle: 0,
  words: {},
  decorations: [],
  mode: 'guided',
  sound: true,
  welcomed: false,
  requestHelp: false,
  helpedKeys: [],
  heard: false,
  cooldowns: {},
});
export type Action =
  | { type: 'trade'; item: Item }
  | { type: 'gather'; item: Item; now: number }
  | { type: 'craft'; item: Item }
  | { type: 'offer'; bag: Inventory }
  | { type: 'hear' }
  | { type: 'help'; key?: string }
  | { type: 'skip' }
  | { type: 'place'; item: Item; slot: number }
  | { type: 'remove'; id: string }
  | { type: 'mode'; mode: State['mode'] }
  | { type: 'sound'; sound: boolean }
  | { type: 'welcome' };
export type Result = { state: State; message: string; ok: boolean };
export const SLOTS = [
  [-3, 2],
  [-3, 3.5],
  [-3, 5],
  [3, -0.5],
  [4.5, -0.5],
  [6, -0.5],
  [4, 2],
  [5.5, 2],
];
export function transition(s: State, a: Action): Result {
  const fail = (message: string): Result => ({ state: s, message, ok: false });
  const next: State = {
    ...s,
    bag: { ...s.bag },
    words: { ...s.words },
    cooldowns: { ...s.cooldowns },
  };
  let message = '';
  if (a.type === 'gather') {
    if (!['wood', 'stone', 'apple', 'flower'].includes(a.item))
      return fail('That cannot be gathered.');
    if ((s.cooldowns[a.item] ?? 0) > a.now)
      return fail('Let it regrow for a moment. Try another spot.');
    if (s.bag[a.item] >= 99)
      return fail('Your bag has enough of that for now.');
    next.bag[a.item] += a.item === 'wood' ? 2 : 1;
    next.cooldowns[a.item] = a.now + 3500;
    message = `+${a.item === 'wood' ? 2 : 1} ${ITEMS[a.item].name.toLowerCase()}`;
  } else if (a.type === 'trade') {
    if (!['wood', 'apple', 'stone', 'flower'].includes(a.item) || s.coins < 6)
      return fail('You need 6 shells for supplies.');
    if (s.bag[a.item] > 96) return fail('Your bag has enough of that.');
    next.coins -= 6;
    next.bag[a.item] += 3;
    message = 'Supplies added to your bag.';
  } else if (a.type === 'craft') {
    const r = RECIPES[a.item];
    if (!r || s.completed < r.unlock)
      return fail('Complete more requests to unlock this recipe.');
    if (Object.entries(r.cost).some(([k, n]) => s.bag[k as Item] < n!))
      return fail('Gather the missing materials first.');
    if (s.bag[a.item] >= 99) return fail('Your bag is full of that item.');
    for (const [k, n] of Object.entries(r.cost)) next.bag[k as Item] -= n!;
    next.bag[a.item]++;
    message = `Made a ${ITEMS[a.item].name.toLowerCase()}!`;
  } else if (a.type === 'hear' || a.type === 'help') {
    const req = makeRequest(s.completed, s.cycle);
    if (a.type === 'hear' && s.heard)
      return { state: s, message: '', ok: true };
    for (const word of req.tokens) {
      if (a.type === 'help' && a.key && word.key !== a.key) continue;
      const old = next.words[word.key] ?? {
        sv: word.sv.replace(/[.?]/g, ''),
        en: word.en,
        encounters: 0,
        successes: 0,
        help: 0,
      };
      next.words[word.key] = {
        ...old,
        encounters: old.encounters + (a.type === 'hear' ? 1 : 0),
        help: old.help + (a.type === 'help' ? 1 : 0),
      };
    }
    if (a.type === 'help')
      next.helpedKeys = [
        ...new Set([
          ...s.helpedKeys,
          ...req.tokens
            .filter((w) => !a.key || w.key === a.key)
            .map((w) => w.key),
        ]),
      ];
    else next.heard = true;
  } else if (a.type === 'offer') {
    for (const k of Object.keys(ITEMS) as Item[]) {
      if (!Number.isInteger(a.bag[k]) || a.bag[k] < 0 || a.bag[k] > s.bag[k])
        return fail('Those items are not in your bag.');
    }
    const req = makeRequest(s.completed, s.cycle);
    const correct = (Object.keys(ITEMS) as Item[]).every(
      (k) => a.bag[k] === (req.needs[k] ?? 0),
    );
    if (!correct) {
      next.requestHelp = true;
      for (const token of req.tokens) {
        const w = next.words[token.key];
        if (w)
          next.words[token.key] = {
            ...w,
            successes: Math.max(0, w.successes - 1),
          };
      }
      return {
        state: next,
        message:
          'Inte riktigt — not quite. Listen again or reveal a hint. Your items are still in your bag.',
        ok: false,
      };
    }
    for (const k of Object.keys(ITEMS) as Item[]) next.bag[k] -= a.bag[k];
    for (const token of req.tokens) {
      const w = next.words[token.key] ?? {
        sv: token.sv.replace(/[.?]/g, ''),
        en: token.en,
        encounters: 1,
        successes: 0,
        help: 0,
      };
      next.words[token.key] = {
        ...w,
        successes:
          w.successes +
          (s.requestHelp || s.helpedKeys.includes(token.key) ? 0 : 1),
      };
    }
    next.completed++;
    next.coins += req.reward;
    next.heard = false;
    next.requestHelp = false;
    next.helpedKeys = [];
    message = `Tack så mycket! +${req.reward} shells`;
  } else if (a.type === 'skip') {
    next.cycle++;
    next.requestHelp = false;
    next.helpedKeys = [];
    next.heard = false;
    message = 'A new visitor is ready at the dock.';
  } else if (a.type === 'place') {
    if (!RECIPES[a.item] || s.bag[a.item] < 1)
      return fail('Craft that item first.');
    if (
      !Number.isInteger(a.slot) ||
      !SLOTS[a.slot] ||
      s.decorations.some(
        (d) => d.x === SLOTS[a.slot][0] && d.z === SLOTS[a.slot][1],
      )
    )
      return fail('That spot is already occupied.');
    const [x, z] = SLOTS[a.slot];
    next.bag[a.item]--;
    next.decorations = [
      ...s.decorations,
      { id: `${a.item}-${a.slot}`, kind: a.item, x, z },
    ];
    message = 'A little more like home.';
  } else if (a.type === 'remove') {
    const d = s.decorations.find((v) => v.id === a.id);
    if (!d) return fail('That decoration is no longer here.');
    next.decorations = s.decorations.filter((v) => v.id !== a.id);
    next.bag[d.kind]++;
    message = 'Returned to your bag.';
  } else if (a.type === 'mode') next.mode = a.mode;
  else if (a.type === 'sound') next.sound = a.sound;
  else if (a.type === 'welcome') next.welcomed = true;
  return { state: next, message, ok: true };
}
export function restore(raw: string | null): State {
  if (!raw) return initialState();
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Number.isInteger(s.completed) ||
      s.completed < 0 ||
      !Number.isInteger(s.cycle) ||
      s.cycle < 0 ||
      !Number.isInteger(s.coins) ||
      s.coins < 0 ||
      !s.bag ||
      !s.words ||
      !Array.isArray(s.decorations)
    )
      return initialState();
    for (const id of Object.keys(ITEMS))
      if (!Number.isInteger(s.bag[id]) || s.bag[id] < 0 || s.bag[id] > 1000)
        return initialState();
    if (
      s.decorations.length > 8 ||
      s.decorations.some(
        (d: Decoration) =>
          !RECIPES[d.kind] || !SLOTS.some(([x, z]) => d.x === x && d.z === z),
      )
    )
      return initialState();
    for (const w of Object.values(s.words) as Word[])
      if (
        typeof w.sv !== 'string' ||
        typeof w.en !== 'string' ||
        !Number.isFinite(w.successes) ||
        !Number.isFinite(w.encounters) ||
        !Number.isFinite(w.help)
      )
        return initialState();
    return {
      ...initialState(),
      ...s,
      mode: ['guided', 'listening', 'immersive'].includes(s.mode)
        ? s.mode
        : 'guided',
      sound: !!s.sound,
      helpedKeys: Array.isArray(s.helpedKeys)
        ? s.helpedKeys.filter((key: unknown) => typeof key === 'string')
        : [],
      cooldowns:
        typeof s.cooldowns === 'object' && s.cooldowns !== null
          ? s.cooldowns
          : {},
    };
  } catch {
    return initialState();
  }
}
