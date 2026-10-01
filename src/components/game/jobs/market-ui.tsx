"use client";

import { useCallback, useMemo, useState } from "react";
import { Banknote, CreditCard, Ear, MessageCircleQuestion, ShoppingBasket, Store, Trash2, Users, Volume2 } from "lucide-react";
import { useDevMode } from "@/components/dev-mode";
import { useLearningModel } from "@/components/providers/learning-model-provider";
import type { Line } from "@/lib/game/line";
import { MARKET_LEVELS, marketStars, tillText } from "@/lib/game/market";
import { conceptStrength } from "@/lib/game/progression";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import { useIsland } from "../island";
import { getGame, useGame } from "../store";
import { Glossed, GlossedLine } from "../ui/glossed";
import { FreeAnswer } from "../ui/lesson-round";
import { useShiftAnchor } from "./anchors";
import { COUNTER, crateX } from "./market-layout";
import { hostHeadMarket, shopperHead } from "./market-room";
import {
  anythingElse,
  beginMarket,
  currentCustomer,
  emptyBasket,
  getMarket,
  leaveMarket,
  marketRuntime,
  marketSetup,
  pardon,
  sayStep,
  startMarket,
  stepLine,
  takePayment,
  tellPrice,
  useMarket,
  type MarketSetup,
} from "./market-store";
import { JobBar, JobClock, JobIntro, JobLabel, JobSummary, useWordLabel } from "./job-ui";

// ---------- Starting ----------

// Marie can use a hand once you know some fruit and vegetables and "ich nehme".
export function useMarketStarter(villager: Villager) {
  const model = useLearningModel();
  const dev = useDevMode();
  const pack = useIsland();
  const save = useGame((s) => s.save.shifts[villager.id]);
  return useMemo(() => {
    const market = pack.market;
    if (!market || market.host !== villager.id) return null;
    const concept = (slug: string) => model.concepts.find((c) => c.languageCode === pack.code && c.slug === slug);
    const stateOf = (slug: string) => {
      const c = concept(slug);
      return c ? model.states.find((s) => s.conceptId === c.id) : undefined;
    };
    // Developer mode treats every word as met, so all of the job opens.
    const met = (slug: string) => dev || (stateOf(slug)?.exposureCount ?? 0) > 0;
    const { frames } = market;
    const numbers = Object.entries(market.numbers)
      .filter(([, slug]) => met(slug))
      .map(([n]) => Number(n));
    const setup: MarketSetup = {
      code: pack.code,
      host: villager,
      market,
      produce: market.produce.filter((p) => met(p.slug)).map((p) => p.slug),
      numbers,
      kilos: met(market.kilo),
      price: met(frames.costs) && met(frames.euro) && numbers.filter((n) => n <= 12).length >= 6,
      payment: met(frames.cash) && met(frames.card),
      clothes: market.clothes.filter((c) => met(c.slug)).map((c) => c.slug),
      colours: market.colours.filter((c) => met(c.slug)).map((c) => c.slug),
      sizes: met(frames.tooSmall) && met(frames.tooBig),
      weight: (slug) => 1.5 - conceptStrength(stateOf(slug)),
      conceptId: (slug) => concept(slug)?.id ?? null,
      record: model.recordObservation,
    };
    const ready = setup.produce.length >= 3 && met(frames.take) && numbers.some((n) => n >= 2 && n <= 5);
    return { ready, start: (level = save?.level ?? 0) => startMarket(setup, level), invite: market.lines.invite, notYet: market.lines.notYet };
  }, [model.concepts, model.states, model.recordObservation, pack, villager, save, dev]);
}

// ---------- The overlay ----------

export function MarketUI() {
  const setup = marketSetup();
  const status = useMarket((s) => s.status);
  const step = useMarket((s) => s.step);
  if (!setup) return null;
  return (
    <div className="shift">
      <MarketTop setup={setup} />
      {status === "running" ? (
        <>
          <CrateLabels setup={setup} />
          <Bubble setup={setup} />
          {step === "order" ? <BasketPanel setup={setup} /> : null}
          {step === "price" ? <PricePanel setup={setup} /> : null}
          {step === "pay" ? <PayPanel setup={setup} /> : null}
        </>
      ) : null}
      {status === "intro" ? <Intro setup={setup} /> : null}
      {status === "done" ? <Summary setup={setup} /> : null}
    </div>
  );
}

function MarketTop({ setup }: { setup: MarketSetup }) {
  // Developer mode lets you jump to any rung from the dots.
  const starter = useMarketStarter(setup.host);
  const dev = useDevMode();
  const { levelIndex, served, customers } = useMarket((s) => s);
  const { lines } = setup.market;
  return (
    <JobBar icon={<Store size={22} />} title={lines.title} levelIndex={levelIndex} levels={MARKET_LEVELS.length} onPick={dev ? (level) => starter?.start(level) : undefined} onClose={leaveMarket}>
      <span>
        <Users size={18} /> <strong>{served}</strong>
        <span className="shift-of">/ {customers.length}</span>
      </span>
      <JobClock label={lines.clock} left={() => marketRuntime.seconds / marketRuntime.total} />
    </JobBar>
  );
}

// While the stall is new, a crate says its name when you point at it.
function CrateLabels({ setup }: { setup: MarketSetup }) {
  const heard = useMarket((s) => s.level.heard);
  const step = useMarket((s) => s.step);
  const hover = useMarket((s) => s.hover);
  const i = setup.market.produce.findIndex((p) => p.slug === hover);
  if (heard || step !== "order" || i < 0) return null;
  const p = setup.market.produce[i];
  return <JobLabel key={p.slug} id="crate-name" at={[crateX(i), COUNTER.top + 0.75, COUNTER.z + 0.3]} text={p.name.t} en={p.name.en} />;
}

// The customer (or Marie, or you) talking.
function Bubble({ setup }: { setup: MarketSetup }) {
  const { said, revealed, step, index, heardParts } = useMarket((s) => s);
  const customer = useMarket(() => currentCustomer());
  const current = useMemo(() => stepLine(step, customer, heardParts), [step, customer, heardParts]);
  const by = said?.by === "host" ? "host" : "customer";
  const where = useCallback(() => (by === "host" ? hostHeadMarket() : shopperHead()), [by]);
  const ref = useShiftAnchor("market-bubble", where, undefined, "side");
  if (!current && !said) return <div ref={ref} className="world-anchor" />;
  const name = by === "host" ? setup.host.name : null;
  const showLine = current && !said?.repeats;
  return (
    <div ref={ref} className="world-anchor">
      <div key={`${index}:${step}:${by}`} className={`shift-bubble ${said?.by === "player" ? "is-player" : ""}`}>
        {name ? <span className="home-bubble-name">{name}</span> : null}
        {said ? (
          <p className="shift-said">
            <Glossed text={said.line.t} en={said.line.en} />
          </p>
        ) : null}
        {showLine ? (
          revealed ? (
            <p className={said ? "shift-order is-small" : "shift-order"}>
              <Glossed text={current.t} en={current.en} />
            </p>
          ) : (
            <p className="shift-order is-heard">
              <Ear size={18} /> …
            </p>
          )
        ) : null}
        {current ? (
          <div className="shift-bubble-tools">
            <button className="icon-button" aria-label={aria(setup.market.lines.repeat)} onClick={() => sayStep()}>
              <Volume2 size={16} />
            </button>
            <button className="shift-pardon" onClick={pardon}>
              <GlossedLine line={setup.market.lines.repeat} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// What's in the basket, "empty it" and "anything else?".
function BasketPanel({ setup }: { setup: MarketSetup }) {
  const basket = useMarket((s) => s.basket);
  const { lines, produce } = setup.market;
  const items = produce.filter((p) => basket[p.slug]);
  const amount = (by: "piece" | "kilo", n: number) => (by === "kilo" ? `${String(n / 2).replace(".", ",")} kg` : `${n}×`);
  return (
    <div className="shift-tray market-basket" aria-label={aria(lines.basket)}>
      <ShoppingBasket size={22} />
      <div className="clinic-pot-items">
        {!items.length ? <span className="cafe-tray-empty">…</span> : null}
        {items.map((p) => (
          <span key={p.slug} className="market-chip">
            <i style={{ background: p.color }} />
            {amount(p.by, basket[p.slug])}
          </span>
        ))}
      </div>
      <button className="btn btn-quiet shift-trash" disabled={!items.length} onClick={emptyBasket}>
        <Trash2 size={17} /> <GlossedLine line={lines.empty} />
      </button>
      <button className="btn btn-primary shift-trash" onClick={anythingElse}>
        <MessageCircleQuestion size={17} /> <GlossedLine line={lines.anythingElse} />
      </button>
    </div>
  );
}

// The till shows the total; you say it in words.
function PricePanel({ setup }: { setup: MarketSetup }) {
  const [round, setRound] = useState(0);
  const customer = useMarket(() => currentCustomer());
  if (!customer) return null;
  const { lines } = setup.market;
  return (
    <div className="dialogue shift-hatch" role="dialog">
      <div className="dialogue-body">
        <div className="market-till">
          <span className="market-till-name">
            <GlossedLine line={lines.till} />
          </span>
          <strong>{tillText(customer.cents)}</strong>
        </div>
        <p className="shift-hatch-line">
          <GlossedLine line={lines.tellPrice} />
        </p>
        <FreeAnswer
          key={round}
          busy={false}
          hint={setup.market.price(customer.cents).t}
          onSubmit={async (answer, via, hinted) => {
            tellPrice(answer, via, hinted);
            setRound((r) => r + 1);
          }}
        />
      </div>
    </div>
  );
}

// Cash or card, as they asked; just the pictures, so the words do the work.
function PayPanel({ setup }: { setup: MarketSetup }) {
  const { lines } = setup.market;
  return (
    <div className="shift-tray market-pay">
      <GlossedLine line={lines.payHow} className="cafe-board-title" />
      <button className="btn market-pay-button" aria-label="cash" onClick={() => takePayment("cash")}>
        <Banknote size={30} />
      </button>
      <button className="btn market-pay-button" aria-label="card" onClick={() => takePayment("card")}>
        <CreditCard size={30} />
      </button>
    </div>
  );
}

function Intro({ setup }: { setup: MarketSetup }) {
  const { host, market } = setup;
  const levelIndex = useMarket((s) => s.levelIndex);
  const [lines] = useState(() => {
    const record = getGame().save.shifts[host.id];
    const firstTime = !(record?.stars.length ?? 0);
    const base: Line[] = firstTime ? market.lines.intro : [market.lines.intro[market.lines.intro.length - 1]];
    // The first run with clothes says where they hang.
    const clothesNow = getMarket().customers.some((c) => c.kind === "clothes");
    const clothesBefore = (record?.stars ?? []).some((_, i) => MARKET_LEVELS[i]?.clothes);
    return clothesNow && !clothesBefore ? [...base, market.lines.clothesIntro] : base;
  });
  return <JobIntro host={host} lines={lines} levelIndex={levelIndex} levels={MARKET_LEVELS.length} onDone={beginMarket} />;
}

function Summary({ setup }: { setup: MarketSetup }) {
  const { served, customers, words, levelUp, gift, levelIndex, late, timeLeft } = useMarket((s) => s);
  const starter = useMarketStarter(setup.host);
  const label = useWordLabel();
  const stars = marketStars(served, customers.length, timeLeft);
  const { lines } = setup.market;
  return (
    <JobSummary
      gift={gift}
      title={lines.title}
      stars={stars}
      line={late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]}
      stats={
        <span>
          <Users size={18} /> {served} / {customers.length}
        </span>
      }
      words={words}
      label={label}
      harder={levelUp ? lines.harder : null}
      again={lines.again}
      back={lines.back}
      onAgain={() => starter?.start(levelUp ? levelIndex + 1 : levelIndex)}
      onBack={leaveMarket}
    />
  );
}
