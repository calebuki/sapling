import type { IslandPack } from "@/content/types";
import { expectedFor } from "@/lib/game/lesson";
import type { Line } from "@/lib/game/line";
import type { SceneBeat } from "@/lib/game/scenes";
import type { Villager } from "@/lib/game/villagers";
import { allRecipeLines } from "@/lib/game/clinic";
import { allHomeLines } from "@/lib/game/home";
import { allOrders, orderVoice } from "@/lib/game/rush";
import { allTimes, customerGender, requestVariant } from "@/lib/game/clock";
import { allFerryLines } from "@/lib/game/ferry";
import { allPrices, clothesGender, type Payment } from "@/lib/game/market";
import { allForestLines } from "@/lib/game/forest";
import { START, type TicketKind } from "@/lib/game/station";
import { passerVoices, playerVoice } from "@/lib/game/voices";
import type { Cefr } from "@/lib/learning/course";
import { clipText } from "@/lib/speech/clips";

// Everything an island says aloud (dialogue, lessons, scenes, drills, the café,
// grammar tips), in the voice the game would use for it. The pre-generation
// script makes these clips; the voice review tool lists them.

export type CatalogLine = {
  text: string;
  en: string | null;
  voice: string;
  slow: boolean;
  // Who says it: a villager's name, "passer-by", "phrase book" or "player".
  speaker: string;
  // Where it is heard, most important first ("lesson phrase", "anna scene cue").
  sources: string[];
  units: string[];
  // The earliest level at which a learner hears it; null outside the course.
  level: Cefr | null;
  // Lower goes first when generating: the neutral voice's repeats come last.
  priority: number;
};

// Lines with the learner's own name differ per player, so they can't be made ahead.
const personal = (text: string) => /Caleb|\{name\}|\{n\}/.test(text);

const levelOrder: Cefr[] = ["A1", "A2"];
const earlier = (a: Cefr | null, b: Cefr | null) => (!a ? b : !b ? a : levelOrder.indexOf(a) <= levelOrder.indexOf(b) ? a : b);

export function collectLines(island: IslandPack, { withSlow = true } = {}): CatalogLine[] {
  const clips = new Map<string, CatalogLine>();
  const units = new Map(island.course.units.map((u) => [u.id, u]));
  const villagers = new Map(island.villagers.map((v) => [v.id, v]));
  const byName = new Map(island.villagers.map((v) => [v.name, v]));
  const byVoice = new Map(island.villagers.map((v) => [v.voice, v]));
  const extras = island.sceneExtras;
  const neutral = passerVoices.woman;

  const unitOfSlug = (slug: string) => island.course.units.find((u) => u.slugs.includes(slug));
  const teacherOf = (slug: string) => {
    const unit = unitOfSlug(slug);
    return unit ? villagers.get(unit.villager) : undefined;
  };
  // A villager's own talk belongs to the first unit they teach.
  const firstUnitOf = (villagerId: string) => island.course.units.find((u) => u.villager === villagerId)?.id;
  const speakerOf = (voice: string) =>
    byVoice.get(voice)?.name ?? (voice === playerVoice ? "player" : voice === neutral ? "phrase book" : "passer-by");

  type Where = { source: string; unit?: string; speaker?: string };
  const add = (line: { t: string; en?: string; parts?: readonly string[] } | string | undefined, voice: string, where: Where, slow = false): void => {
    // A line spoken in pieces is recorded piece by piece.
    if (typeof line === "object" && line.parts) return line.parts.forEach((part) => add(part, voice, where, slow));
    const raw = typeof line === "string" ? line : line?.t;
    const t = raw ? clipText(raw) : "";
    if (!t || personal(t)) return;
    const en = typeof line === "object" ? (line.en ?? null) : null;
    const unit = where.unit ? units.get(where.unit) : undefined;
    const key = `${voice}|${slow}|${t}`;
    const existing = clips.get(key);
    if (existing) {
      if (!existing.sources.includes(where.source)) existing.sources.push(where.source);
      if (unit && !existing.units.includes(unit.id)) existing.units.push(unit.id);
      existing.level = earlier(existing.level, unit?.level ?? null);
      existing.en ??= en;
      return;
    }
    const priority = (slow ? 2 : 0) + (voice === neutral && !/where|customer|scene|café cue|café reaction/.test(where.source) ? 1 : 0);
    clips.set(key, {
      text: t,
      en,
      voice,
      slow,
      speaker: where.speaker ?? speakerOf(voice),
      sources: [where.source],
      units: unit ? [unit.id] : [],
      level: unit?.level ?? null,
      priority,
    });
  };
  const addLines = (lines: Line[] | undefined, voice: string, where: Where) => lines?.forEach((l) => add(l, voice, where));

  // Same rules as voiceOf in scene-round.tsx.
  const voiceOf = (name: string | undefined, villager: Villager, pitch?: number) => {
    const other = name ? byName.get(name) : undefined;
    if (other) return { voice: other.voice, speaker: other.name };
    const gender = (name ? extras.speakers[name] : undefined) ?? ((pitch ?? villager.voicePitch) < 1 ? "man" : "woman");
    return { voice: passerVoices[gender], speaker: name && name !== "?" ? name : "passer-by" };
  };
  const addBeat = (beat: SceneBeat, villager: Villager, source: string, unit?: string) => {
    const { voice, speaker } = voiceOf(beat.speaker === "?" ? beat.guest : beat.speaker, villager, beat.pitch);
    add(beat.cue, voice, { source: `${source} cue`, unit, speaker });
    add(beat.reaction, voice, { source: `${source} reaction`, unit, speaker });
    beat.branches?.forEach((b) => add(b.reaction, voice, { source: `${source} reaction`, unit, speaker }));
    if (beat.expect) {
      // Said back by the villager in feedback, and by the neutral voice on "you can say".
      add(beat.expect, villager.voice, { source: `${source} answer`, unit });
      add(beat.expect, neutral, { source: `${source} answer`, unit });
    }
  };

  // Dialogue.
  const host = villagers.get(island.host);
  if (host) addLines(island.script.intro, host.voice, { source: "intro" });
  for (const v of island.villagers) {
    addLines([...v.greetings, ...v.chatter, v.locked, v.teach, ...v.goodbye], v.voice, {
      source: `${v.id} dialogue`,
      unit: firstUnitOf(v.id),
    });
  }

  // Lesson phrases: the teacher says them, the phrase book and replays use the neutral voice.
  for (const lesson of island.course.lessons) {
    for (const exercise of lesson.exercises) {
      const teacher = teacherOf(exercise.conceptSlug);
      const unit = unitOfSlug(exercise.conceptSlug)?.id;
      const line = { t: expectedFor(exercise, null), en: exercise.meaning ?? exercise.prompt };
      if (teacher) add(line, teacher.voice, { source: "lesson phrase", unit });
      add(line, neutral, { source: "lesson phrase", unit });
      if (withSlow) {
        if (teacher) add(line, teacher.voice, { source: "lesson phrase (slow)", unit }, true);
        add(line, neutral, { source: "lesson phrase (slow)", unit }, true);
      }
    }
  }

  // Listening items, and introductions in the voice of whoever introduces themselves.
  for (const item of island.course.listenSpeakItems) {
    const teacher = teacherOf(item.conceptSlug);
    if (!teacher) continue;
    const unit = unitOfSlug(item.conceptSlug)?.id;
    const line = { t: item.text, en: item.meaning };
    add(line, teacher.voice, { source: "listening", unit });
    const name = extras.guestNames.find((n) => item.text.includes(n));
    if (name) {
      const { voice, speaker } = voiceOf(name, teacher);
      add(line, voice, { source: "introduction", unit, speaker });
    }
  }

  // Scenes.
  for (const [villagerId, bySlug] of Object.entries(island.scenes)) {
    const villager = villagers.get(villagerId);
    if (!villager) continue;
    for (const [slug, beats] of Object.entries(bySlug)) {
      beats.forEach((beat) => addBeat(beat, villager, `${villagerId} scene`, unitOfSlug(slug)?.id));
    }
  }

  // Drills.
  extras.whereQuestions.forEach((q) => add(q, passerVoices.woman, { source: "where question", speaker: "passer-by" }));
  extras.announcements.forEach((a) => add(a, passerVoices.man, { source: "announcement", speaker: "announcer" }));
  for (const [slug, sentences] of Object.entries(extras.whenSentences)) {
    const teacher = teacherOf(slug);
    const unit = unitOfSlug(slug)?.id;
    if (teacher) sentences.forEach((s) => add(s, teacher.voice, { source: "when sentence", unit }));
  }

  // The café.
  const cafe = island.cafe;
  const barista = island.villagers.find((v) => v.round === "cafe");
  if (cafe && barista) {
    const unit = firstUnitOf(barista.id);
    for (const item of cafe.menu) {
      for (const line of [cafe.introduce(item), cafe.price(item), cafe.serve(item), cafe.checkOrder(item)]) {
        add(line, barista.voice, { source: "café", unit });
      }
    }
    addLines(Object.values(cafe.lines), barista.voice, { source: "café", unit });
    for (const [slug, variants] of Object.entries(cafe.orderVariants)) {
      const orderUnit = unitOfSlug(slug)?.id ?? unit;
      variants.forEach((o) => {
        add(o, barista.voice, { source: "café order", unit: orderUnit });
        add(o, neutral, { source: "café order", unit: orderUnit });
      });
    }
    cafe.trayOrders.forEach((o) => add(o, passerVoices.woman, { source: "café customer", unit, speaker: "customer" }));
    addBeat(cafe.orderExchange, barista, "café", unit);
    addBeat(cafe.billExchange, barista, "café", unit);
    // The busy shift: the host's lines, then everything guests can say.
    const rush = cafe.rush;
    if (rush) {
      const { lines } = rush;
      addLines([...lines.intro, ...lines.done, lines.kitchenAsk, lines.kitchenHuh, lines.kitchenNotHere, lines.harder], barista.voice, { source: "café shift", unit });
      for (const item of rush.kitchen) {
        for (const count of [1, 2] as const) add(rush.kitchenGive([{ item, count }]), barista.voice, { source: "café shift", unit });
      }
      for (const order of allOrders(cafe, rush)) add(order, passerVoices[orderVoice(order.t)], { source: "café shift guest", unit, speaker: "customer" });
      const guestLines = [...lines.thanks, lines.angry];
      for (const want of cafe.menu) {
        guestLines.push(rush.missing(want), rush.extra(want));
        for (const got of cafe.menu) if (got.slug !== want.slug) guestLines.push(rush.wrong(want, got));
      }
      for (const voice of [passerVoices.woman, passerVoices.man]) guestLines.forEach((line) => add(line, voice, { source: "café shift guest", unit, speaker: "customer" }));
    }
  }

  // Helping at the host's home: everything they ask and say back.
  const home = island.home;
  const homeHost = home ? villagers.get(home.host) : undefined;
  if (home && homeHost) {
    const where = { source: "home job", unit: firstUnitOf(homeHost.id) };
    const { lines } = home;
    addLines([...lines.intro, lines.tellIntro, lines.tell, lines.repeat, ...lines.thanks, lines.late, ...lines.done, lines.harder], homeHost.voice, where);
    addLines(allHomeLines(home), homeHost.voice, where);
  }

  // Surgery hours: the doctor reads recipes; patients (a man's or a woman's voice) say what's wrong.
  const clinic = island.clinic;
  const doctor = clinic ? villagers.get(clinic.host) : undefined;
  if (clinic && doctor) {
    const where = { source: "clinic job", unit: firstUnitOf(doctor.id) };
    const { lines } = clinic;
    addLines([...lines.intro, lines.brewWrong, lines.brewRight, lines.replyWrong, lines.late, ...lines.done, lines.harder], doctor.voice, where);
    const patients = [...clinic.parts.flatMap((p) => [clinic.complaint(p, 0), clinic.complaint(p, 1)]), ...clinic.feelings.map((f) => f.line), lines.adviceAsk, lines.adviceWrong, ...lines.thanks];
    for (const part of clinic.parts) for (const other of clinic.parts) if (other.slug !== part.slug) patients.push(clinic.wrongPart(part, other));
    for (const voice of [passerVoices.woman, passerVoices.man]) addLines(patients, voice, { ...where, speaker: "patient" });
    addLines(allRecipeLines(clinic), doctor.voice, where);
    addLines([lines.drink, ...Object.values(clinic.replies).map((r) => r.line), ...Object.values(clinic.advice).map((a) => a!.say)], playerVoice, { ...where, speaker: "player" });
  }

  // The clockmaker's: customers ask for times, the host greets and wraps up.
  const clock = island.clock;
  const clockmaker = clock ? villagers.get(clock.host) : undefined;
  if (clock && clockmaker) {
    const where = { source: "clock job", unit: firstUnitOf(clockmaker.id) };
    const { lines } = clock;
    addLines([...lines.intro, lines.late, ...lines.done, lines.harder, ...(clock.appointments ? [clock.appointments.wrong] : [])], clockmaker.voice, where);
    const customers = [clock.ask, clock.toldWrong, clock.words, lines.repeat, ...lines.thanks];
    for (const time of allTimes()) {
      customers.push(clock.told(time), { t: clock.wrongTime(time, time).parts?.[0] ?? "", en: `No, that's ${clock.say(time).en}!` });
      // What the customer bringing this time says, in their own voice; wrongTime(t, t) ends with their "I need …".
      const own = passerVoices[customerGender(time)];
      addLines([clock.setRequest(time, requestVariant(time)), clock.wrongTime(time, time)], own, { ...where, speaker: "customer" });
    }
    if (clock.appointments) for (const day of clock.appointments.days) for (const hour of [9, 10, 11, 2, 3, 4]) customers.push(clock.appointments.ask(day, hour));
    for (const voice of [passerVoices.woman, passerVoices.man]) addLines(customers, voice, { ...where, speaker: "customer" });
    if (clock.appointments) addLines([clock.appointments.yes.line, clock.appointments.no.line], playerVoice, { ...where, speaker: "player" });
  }

  // The ferry: passengers say who they are (each in their own voice), the
  // ferry keeper runs the landing stage, you greet and ask.
  const ferry = island.ferry;
  const keeper = ferry ? villagers.get(ferry.host) : undefined;
  if (ferry && keeper) {
    const where = { source: "ferry job", unit: firstUnitOf(keeper.id) };
    const { lines } = ferry;
    addLines([...lines.intro, lines.registerIntro, lines.listWrong, lines.listRight, lines.late, ...lines.done, lines.harder], keeper.voice, where);
    for (const person of ferry.people) {
      addLines([ferry.introduce(person), ferry.spell(person), ferry.wrongRegister(person)], passerVoices[person.gender], { ...where, speaker: "passenger" });
    }
    const shared = allFerryLines(ferry).filter((l) => !ferry.people.some((p) => [ferry.introduce(p).t, ferry.spell(p).t, ferry.wrongRegister(p).t].includes(l.t)));
    const own = new Set([ferry.askName.du.say.t, ferry.askName.Sie.say.t, ...Object.values(ferry.repairs).flatMap((r) => [r.say.du.t, r.say.Sie.t])]);
    for (const voice of [passerVoices.woman, passerVoices.man]) addLines([...shared.filter((l) => !own.has(l.t)), lines.pardon], voice, { ...where, speaker: "passenger" });
    addLines(shared.filter((l) => own.has(l.t)), playerVoice, { ...where, speaker: "player" });
  }

  // The market stall: customers order (in either voice), clothes shoppers in
  // the voice their wish belongs to, the seller says the price.
  const market = island.market;
  const seller = market ? villagers.get(market.host) : undefined;
  if (market && seller) {
    const where = { source: "market job", unit: firstUnitOf(seller.id) };
    const { lines } = market;
    addLines([...lines.intro, lines.clothesIntro, lines.priceWrong, lines.words, lines.late, ...lines.done, lines.harder], seller.voice, where);
    const customers: Line[] = [...lines.hello, lines.yes, lines.thatsAll, lines.wrongBasket, lines.notThat, lines.whatCosts, ...lines.thanks];
    for (const p of market.produce) for (const n of p.by === "kilo" ? [1, 2, 4] : [1, 2, 3, 4, 5]) customers.push(market.order({ produce: p, n }, 0), market.order({ produce: p, n }, 1));
    for (const item of market.clothes) customers.push(market.wrongSize(item, "small"), market.wrongSize(item, "large"), market.fits(item));
    for (const payment of ["cash", "card"] as Payment[]) customers.push(market.pay(payment), market.wrongPay(payment));
    for (const voice of [passerVoices.woman, passerVoices.man]) addLines(customers, voice, { ...where, speaker: "customer" });
    for (const item of market.clothes) for (const colour of market.colours) add(market.ask(item, colour), passerVoices[clothesGender(item, colour)], { ...where, speaker: "customer" });
    addLines([lines.anythingElse, ...allPrices(market).map((c) => market.price(c))], playerVoice, { ...where, speaker: "player" });
  }

  // The wildlife survey: the forester whispers everything; one hiker passes by.
  const forest = island.forest;
  const forester = forest ? villagers.get(forest.host) : undefined;
  if (forest && forester) {
    const where = { source: "forest job", unit: firstUnitOf(forester.id) };
    const { lines } = forest;
    addLines([...lines.intro, ...lines.nice, lines.weatherAsk, lines.weatherWrong, lines.weatherRight, lines.words, lines.late, ...lines.done, lines.harder], forester.voice, where);
    addLines(allForestLines(forest).filter((l) => !forest.weathers.some((w) => w.say.t === l.t)), forester.voice, where);
    addLines([lines.hikerHello, lines.hikerAsk, lines.hikerReply, lines.hikerHuh], passerVoices.man, { ...where, speaker: "hiker" });
    addLines(forest.weathers.map((w) => w.say), playerVoice, { ...where, speaker: "player" });
  }

  // The station: travellers ask (either voice), the station master gives
  // directions piece by piece, you ask "one way or return?" and say the platform.
  const station = island.station;
  const master = station ? villagers.get(station.host) : undefined;
  if (station && master) {
    const where = { source: "station job", unit: firstUnitOf(master.id) };
    const { lines } = station;
    addLines([...lines.intro, lines.townIntro, lines.platformWrong, lines.words, lines.carry, lines.lost, lines.late, ...lines.done, lines.harder], master.voice, where);
    const directions: Line[] = [station.instruction({ kind: "straight" })];
    for (const way of ["left", "right"] as const) {
      directions.push(station.instruction({ kind: "turn", way, at: START, ref: { type: "light" } }));
      for (let n = 1; n <= 3; n++) directions.push(station.instruction({ kind: "turn", way, at: START, ref: { type: "ordinal", n } }));
      for (const landmark of station.landmarks) {
        directions.push(station.instruction({ kind: "turn", way, at: landmark.node, ref: { type: "landmark", landmark } }), station.instruction({ kind: "arrive", landmark, side: way }));
      }
    }
    addLines(directions, master.voice, where);
    const travellers: Line[] = [...lines.hello, lines.askPlatform, ...lines.thanks, lines.arrived, lines.repeat];
    for (const d of station.destinations) for (const kind of ["single", "return"] as TicketKind[]) travellers.push(station.wrongTicket(d, kind));
    for (const kind of ["single", "return"] as TicketKind[]) travellers.push(station.kindAnswer(kind));
    for (const l of station.landmarks) travellers.push(station.askWay(l), station.wrongBuilding(l));
    for (const voice of [passerVoices.woman, passerVoices.man]) addLines(travellers, voice, { ...where, speaker: "traveller" });
    addLines([lines.whichKind, ...[1, 2, 3, 4].map((n) => station.platform(n))], playerVoice, { ...where, speaker: "player" });
  }

  // Grammar tips, read out by whoever teaches the unit.
  for (const tip of island.grammar) {
    const unit = units.get(tip.unit);
    const teacher = unit ? villagers.get(unit.villager) : undefined;
    if (!teacher) continue;
    tip.cards.forEach((card) =>
      card.examples.forEach((e) => add({ t: e.t.replace("→", ","), en: e.en }, teacher.voice, { source: "grammar", unit: tip.unit })),
    );
    add(tip.check.answer, teacher.voice, { source: "grammar", unit: tip.unit });
  }

  // Things you find: you say them, the phrase book repeats them.
  island.discoveries.forEach((d) => {
    add(d, playerVoice, { source: "discovery" });
    add(d, neutral, { source: "discovery" });
  });

  return [...clips.values()].sort((a, b) => a.priority - b.priority);
}
