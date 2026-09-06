import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  transition,
  makeRequest,
  emptyBag,
  ITEMS,
  RECIPES,
  restore,
  visitorDelay,
  COLORS,
  EXPANSION_COSTS,
} from '../lib/game.ts';
const run = (s, a) => transition(s, a).state;
test('wrong delivery does not consume resources or grant rewards', () => {
  let s = run(initialState(), { type: 'gather', item: 'stone', now: 100 });
  s = run(s, { type: 'hear' });
  const r = transition(s, { type: 'offer', bag: { ...emptyBag(), stone: 1 } });
  assert.equal(r.ok, false);
  assert.deepEqual(r.state.bag, s.bag);
  assert.equal(r.state.coins, 0);
  assert.equal(r.state.completed, 0);
});
test('crafting and supplies reject insufficient resources; valid crafting charges once', () => {
  let s = initialState();
  assert.equal(transition(s, { type: 'craft', item: 'chair' }).ok, false);
  assert.equal(transition(s, { type: 'trade', item: 'wood' }).ok, false);
  s = run(s, { type: 'gather', item: 'wood', now: 0 });
  assert.equal(
    transition(s, { type: 'gather', item: 'wood', now: 1 }).ok,
    false,
  );
  s = run(s, { type: 'gather', item: 'wood', now: 4000 });
  s = run(s, { type: 'craft', item: 'chair' });
  assert.equal(s.bag.wood, 1);
  assert.equal(s.bag.chair, 1);
});
test('hints do not count as independent success; unrelated words still get credit', () => {
  let s = run(initialState(), { type: 'hear' });
  s = run(s, { type: 'help', key: 'apple' });
  s = run(s, { type: 'gather', item: 'apple', now: 1 });
  s = run(s, { type: 'offer', bag: { ...emptyBag(), apple: 1 } });
  assert.equal(s.words.apple.successes, 0);
  assert.equal(s.words.jag.successes, 1);
  assert.equal(s.completed, 1);
  assert.equal(s.coins, 11);
});
test('reopening a request cannot farm word exposure', () => {
  let s = run(initialState(), { type: 'hear' });
  const before = structuredClone(s.words);
  for (let i = 0; i < 10; i++) s = run(s, { type: 'hear' });
  assert.deepEqual(s.words, before);
});
test('placed furniture consumes one item, rejects duplicate spot, and is recoverable', () => {
  let s = initialState();
  s.bag.chair = 2;
  s = run(s, { type: 'place', item: 'chair', slot: 0 });
  assert.equal(s.bag.chair, 1);
  assert.equal(
    transition(s, { type: 'place', item: 'chair', slot: 0 }).ok,
    false,
  );
  s = run(s, { type: 'remove', id: s.decorations[0].id });
  assert.equal(s.bag.chair, 2);
  assert.equal(s.decorations.length, 0);
});
test('100 consecutive requests are fulfillable with unlocked recipes and preserve state', () => {
  let s = initialState(),
    time = 0;
  const kinds = new Set();
  function gather(id, n) {
    while (s.bag[id] < n) {
      time += 4000;
      s = run(s, { type: 'gather', item: id, now: time });
    }
  }
  for (let i = 0; i < 100; i++) {
    const req = makeRequest(s.completed, s.cycle);
    s = run(s, { type: 'hear', now: s.nextVisitorAt });
    for (const [id, n] of Object.entries(req.needs)) {
      kinds.add(id);
      if (RECIPES[id]) {
        assert.ok(s.completed >= RECIPES[id].unlock);
        while (s.bag[id] < n) {
          for (const [raw, count] of Object.entries(RECIPES[id].cost))
            gather(raw, count);
          const crafted = transition(s, { type: 'craft', item: id });
          assert.ok(crafted.ok);
          s = crafted.state;
        }
      } else gather(id, n);
    }
    const r = transition(s, {
      type: 'offer',
      now: s.nextVisitorAt,
      random: 0.5,
      bag: { ...emptyBag(), ...req.needs },
    });
    assert.ok(r.ok);
    s = r.state;
    assert.equal(s.completed, i + 1);
    assert.ok(Object.values(s.bag).every((n) => n >= 0));
    assert.deepEqual(restore(JSON.stringify(s)), s);
  }
  assert.equal(kinds.size, Object.keys(ITEMS).length);
});
test('invalid save data falls back safely', () => {
  assert.deepEqual(restore('{oops'), initialState());
  const s = initialState();
  s.bag.apple = -5;
  assert.deepEqual(restore(JSON.stringify(s)), initialState());
});
import { routeTo, walkable, clearPath } from '../lib/navigation.ts';
test('walking routes around the workshop and refuses water or indoor destinations', () => {
  const start = { x: -4, z: -4 },
    end = { x: 4, z: -4 };
  assert.equal(clearPath(start, end), false);
  const route = routeTo(start, end);
  assert.ok(route.length >= 3);
  assert.deepEqual(route.at(-1), end);
  let previous = start;
  for (const p of route) {
    assert.ok(walkable(p));
    assert.ok(clearPath(previous, p));
    previous = p;
  }
  assert.deepEqual(routeTo({ x: 0, z: 2 }, { x: 0, z: -3.5 }), []);
  assert.deepEqual(routeTo({ x: 0, z: 2 }, { x: 20, z: 0 }), []);
});
test('all canonical gathering and visitor points remain mutually reachable', () => {
  const spots = [
    [-5, -1.3],
    [-6, 3.7],
    [5, -2.3],
    [4, 4.7],
    [0, -1.3],
    [1.3, 5.3],
  ];
  for (const [x, z] of spots)
    for (const [tx, tz] of spots)
      assert.ok(routeTo({ x, z }, { x: tx, z: tz }).length);
});

test('visits vary, survive reload, and cannot be opened or skipped early', () => {
  assert.equal(visitorDelay(0), 25000);
  assert.equal(visitorDelay(1), 90000);
  let s = initialState();
  s.bag.apple = 1;
  s = run(s, {
    type: 'offer',
    bag: { ...emptyBag(), apple: 1 },
    now: 1000,
    random: 0.5,
  });
  assert.equal(s.nextVisitorAt, 58500);
  s = restore(JSON.stringify(s));
  for (const type of ['hear', 'skip'])
    assert.equal(transition(s, { type, now: 58499 }).ok, false);
  assert.equal(
    transition(s, { type: 'offer', bag: emptyBag(), now: 58499 }).ok,
    false,
  );
  assert.equal(transition(s, { type: 'hear', now: 58500 }).ok, true);
  s = run(s, { type: 'skip', now: 58500, random: 1 });
  assert.equal(s.nextVisitorAt, 148500);
});
test('free placement preserves color and rotation, rejects obstacles, and refunds inventory', () => {
  let s = initialState();
  s.bag.chair = 3;
  for (const [x, z] of [
    [0, -3],
    [-5, -2],
    [40, 40],
    [NaN, 2],
  ])
    assert.equal(
      transition(s, { type: 'place', item: 'chair', x, z }).ok,
      false,
    );
  s = run(s, {
    type: 'place',
    item: 'chair',
    x: -3.25,
    z: 1.75,
    rotation: 90,
    color: COLORS[2],
  });
  assert.equal(s.decorations[0].rotation, 90);
  assert.equal(s.decorations[0].color, COLORS[2]);
  assert.deepEqual(restore(JSON.stringify(s)), s);
  assert.equal(
    transition(s, { type: 'place', item: 'chair', x: -3, z: 2 }).ok,
    false,
  );
  s = run(s, { type: 'remove', id: s.decorations[0].id });
  assert.equal(s.bag.chair, 3);
});
test('expansion costs shells, unlocks actual walkable land, and is bounded', () => {
  let s = initialState();
  s.bag.chair = 1;
  assert.equal(transition(s, { type: 'expand' }).ok, false);
  assert.equal(
    transition(s, { type: 'place', item: 'chair', x: 10, z: 0 }).ok,
    false,
  );
  s.coins = 300;
  for (let i = 0; i < 3; i++) {
    const before = s.coins;
    s = run(s, { type: 'expand' });
    assert.equal(s.coins, before - EXPANSION_COSTS[i]);
  }
  assert.equal(transition(s, { type: 'expand' }).ok, false);
  assert.equal(walkable({ x: 12, z: 0 }, s.expansion), true);
  assert.ok(routeTo({ x: 0, z: 2 }, { x: 12, z: 0 }, s.expansion).length);
  s = run(s, { type: 'place', item: 'chair', x: 10, z: 0 });
  assert.equal(s.decorations.length, 1);
  assert.deepEqual(restore(JSON.stringify(s)), s);
});
test('old saves retain their inventory and furniture; customization persists', () => {
  let s = initialState();
  s.bag.table = 2;
  s.decorations = [{ id: 'chair-0', kind: 'chair', x: -3, z: 2 }];
  for (const key of ['expansion', 'nextVisitorAt', 'islandName', 'roofColor'])
    delete s[key];
  s = restore(JSON.stringify(s));
  assert.equal(s.bag.table, 2);
  assert.equal(s.decorations.length, 1);
  assert.equal(s.expansion, 0);
  s = run(s, { type: 'personalize', name: 'My little home', color: COLORS[3] });
  assert.equal(restore(JSON.stringify(s)).islandName, 'My little home');
});

const piece = (kind = 'floor', extras = {}) => ({
  kind,
  x: -2,
  z: 0,
  level: 0,
  rotation: 0,
  color: COLORS[0],
  material: 'wood',
  area: 'workshop',
  ...extras,
});
test('workshop expansion charges once, unlocks space, and survives restore', () => {
  let s = initialState();
  assert.equal(transition(s, { type: 'workshop-expand' }).ok, false);
  s.bag.wood = 50;
  s.bag.stone = 30;
  assert.equal(
    transition(s, { type: 'build', piece: piece('floor', { x: 4 }) }).ok,
    false,
  );
  s = run(s, { type: 'workshop-expand' });
  assert.equal(s.bag.wood, 40);
  assert.equal(s.bag.stone, 24);
  s = run(s, { type: 'build', piece: piece('floor', { x: 4 }) });
  assert.equal(s.buildings.length, 1);
  s = run(s, { type: 'workshop-expand' });
  assert.equal(transition(s, { type: 'workshop-expand' }).ok, false);
  assert.deepEqual(restore(JSON.stringify(s)), s);
});
test('building costs, duplicate rejection and refunds preserve materials', () => {
  let s = initialState();
  s.bag.wood = 20;
  s.bag.stone = 20;
  s = run(s, { type: 'build', piece: piece('wall', { material: 'stone' }) });
  assert.equal(s.bag.stone, 17);
  assert.equal(
    transition(s, { type: 'build', piece: piece('window') }).ok,
    false,
  );
  const before = structuredClone(s.bag);
  s = run(s, {
    type: 'build-edit',
    id: s.buildings[0].id,
    piece: piece('wall', {
      material: 'stone',
      rotation: 90,
      color: COLORS[3],
      x: -1,
    }),
  });
  assert.deepEqual(s.bag, before);
  assert.equal(
    transition(s, {
      type: 'build-edit',
      id: s.buildings[0].id,
      piece: piece('wall'),
    }).ok,
    false,
  );
  s = run(s, { type: 'build-remove', id: s.buildings[0].id });
  assert.equal(s.bag.stone, 20);
  assert.equal(s.bag.wood, 20);
});
test('furniture inside uses inventory, can be edited, and is refundable', () => {
  let s = initialState();
  assert.equal(
    transition(s, { type: 'build', piece: piece('chair') }).ok,
    false,
  );
  s.bag.chair = 1;
  s = run(s, { type: 'build', piece: piece('chair') });
  assert.equal(s.bag.chair, 0);
  const id = s.buildings[0].id;
  s = run(s, {
    type: 'build-edit',
    id,
    piece: piece('chair', { x: 1, rotation: 180, color: COLORS[2] }),
  });
  assert.equal(s.buildings[0].x, 1);
  assert.equal(s.bag.chair, 0);
  s = run(s, { type: 'build-remove', id });
  assert.equal(s.bag.chair, 1);
});
test('outdoor and upstairs structures require floors and protect their supports', () => {
  let s = initialState();
  s.bag.wood = 99;
  s.bag.stone = 99;
  assert.equal(
    transition(s, { type: 'build', piece: piece('wall', { area: 'island' }) })
      .ok,
    false,
  );
  assert.equal(
    transition(s, { type: 'build', piece: piece('table', { level: 1 }) }).ok,
    false,
  );
  s = run(s, { type: 'build', piece: piece('floor', { area: 'island' }) });
  const floor = s.buildings[0];
  s = run(s, { type: 'build', piece: piece('wall', { area: 'island' }) });
  assert.equal(s.buildings.length, 2);
  assert.equal(transition(s, { type: 'build-remove', id: floor.id }).ok, false);
  assert.equal(
    transition(s, {
      type: 'build-edit',
      id: floor.id,
      piece: { ...floor, x: -3 },
    }).ok,
    false,
  );
  s = run(s, {
    type: 'build',
    piece: piece('floor', { area: 'island', level: 1 }),
  });
  assert.equal(s.buildings.length, 3);
  assert.deepEqual(restore(JSON.stringify(s)), s);
});
test('outdoor furniture moves atomically and rejects overlaps without consuming items', () => {
  let s = initialState();
  s.bag.chair = 1;
  s = run(s, { type: 'place', item: 'chair', x: -3, z: 2 });
  const d = s.decorations[0];
  const failed = transition(s, {
    type: 'edit',
    id: d.id,
    x: 0,
    z: -3,
    rotation: 90,
    color: COLORS[1],
  });
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.state, s);
  s = run(s, {
    type: 'edit',
    id: d.id,
    x: -3,
    z: 0,
    rotation: 90,
    color: COLORS[1],
  });
  assert.equal(s.decorations[0].id, d.id);
  assert.equal(s.bag.chair, 0);
  assert.equal(s.decorations[0].z, 0);
});
test('legacy saves gain an empty workshop without losing progress', () => {
  const s = initialState();
  s.completed = 8;
  s.bag.wood = 12;
  delete s.buildings;
  delete s.workshopLevel;
  const restored = restore(JSON.stringify(s));
  assert.equal(restored.completed, 8);
  assert.equal(restored.bag.wood, 12);
  assert.deepEqual(restored.buildings, []);
  assert.equal(restored.workshopLevel, 0);
});
