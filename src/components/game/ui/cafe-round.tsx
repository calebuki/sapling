"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Receipt } from "lucide-react";
import { cafeItem, cafeLines, cafeMenu, introduceLine, itemsIn, mixUp, orderSlugs, orderVariants, priceLine, trayOrders, withArticle, type CafeIcon, type CafeItem } from "@/lib/game/cafe";
import { acceptsAnswer, pickVariant, type SceneBeat } from "@/lib/game/scenes";
import { checkAnswer, expectedFor, meaningOf } from "@/lib/game/lesson";
import type { AdaptiveActivity } from "@/lib/learning/adaptive";
import type { LearnerConceptState } from "@/types/learning";
import { ui } from "@/lib/game/ui-text";
import type { Line, Villager } from "@/lib/game/villagers";
import { sound } from "../audio/sfx";
import { speakSwedish } from "../audio/speech";
import { emote } from "../store";
import {
  ActivityView,
  Feedback,
  FreeAnswer,
  judgeAnswer,
  SayItPractice,
  Tiles,
  useLessonRound,
  type RecordFn,
  type RoundSummary,
} from "./lesson-round";
import { Exchange, ListenButtons } from "./scene-round";
import { Sv, SvLine } from "./sv";

const CAFE_ROUND = 6;
// Everyday constructions Bosse also owns; they join once the menu is familiar.
const GENERAL_PHRASES = ["har", "gillar", "vill-ha"];

// Menu words and orders have few listening drills in the course, so the
// counter supplies them: point at the item you hear, or fill a customer's tray
// from what they order, whenever hearing lags behind saying.
function pointWhenListeningLags(activity: AdaptiveActivity | null, states: LearnerConceptState[]) {
  if (!activity || activity.mode !== "recall") return activity;
  const isItem = Boolean(cafeItemByConcept(activity));
  if (!isItem && !orderSlugs.has(activity.exercise.conceptSlug)) return activity;
  const state = states.find((s) => s.conceptId === activity.conceptId);
  const floor = isItem ? 0.45 : 0;
  const lagging = (state?.recognitionAudio ?? 0) < Math.max(floor, (state?.recall ?? 0) - 0.15);
  return lagging ? { ...activity, id: activity.id.replace(":recall:", ":listen:"), mode: "listen" as const } : activity;
}

// Bosse's side of an order, so he can answer what you actually asked for.
const orderExchange: SceneBeat = {
  situation: "You're ordering at the counter of Café Kanel.",
  speaker: "Bosse",
  cue: { sv: "Hej! Vad vill du ha?", en: "Hi! What would you like?" },
  reaction: { sv: "Varsågod! Det blir gott.", en: "Here you go! It'll taste good." },
};
const billExchange: SceneBeat = {
  situation: "You've finished your fika at Café Kanel.",
  speaker: "Bosse",
  cue: { sv: "Var det gott?", en: "Did you enjoy it?" },
  reaction: { sv: "Det blir femtiofem kronor, tack.", en: "That'll be fifty-five kronor, thanks." },
};

const cafeItemByConcept = (activity: AdaptiveActivity) => cafeItem(activity.exercise.conceptSlug);

// Bosse teaches at his counter: the same adaptive schedule as every lesson,
// played out with the menu board, a tray that fills with what you order, and
// the occasional mix-up for you to sort out.
export function CafeRound({ villager, onFinish }: { villager: Villager; onFinish: (summary: RoundSummary) => void }) {
  const round = useLessonRound(villager, onFinish, { roundLength: CAFE_ROUND, later: GENERAL_PHRASES, adapt: pointWhenListeningLags });
  const { activity, concept, name, outcome, queued, busy, attempts, summary } = round;
  const [tray, setTray] = useState<CafeItem[]>([]);
  const [preview, setPreview] = useState<CafeItem[]>([]);
  const [fix, setFix] = useState<(ReturnType<typeof mixUp> & { want: CafeItem; picked: number | null }) | null>(null);
  const [pointed, setPointed] = useState<{ picked: string; answer: string } | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  // Varies the order variants from one round to the next.
  const [seed] = useState(() => Math.floor(Math.random() * 1e6));
  const fixUsed = useRef(false);
  const lastOrder = useRef<CafeItem[]>([]);

  if (!activity || !concept) {
    return (
      <div className="dialogue-actions">
        <button className="btn btn-primary" autoFocus onClick={() => onFinish(summary.current)}>
          <SvLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const exercise = activity.exercise;
  // Stable for one activity, from its prompt through its feedback.
  const key = `${activity.id}:${attempts.length - (outcome ? 1 : 0)}`;
  const item = cafeItem(concept.slug);
  const isOrder = orderSlugs.has(concept.slug);
  // Orders come in several variants (other drinks, other buns) so tickets rarely repeat.
  const variants = isOrder ? orderVariants[concept.slug] ?? [] : [];
  const variant = variants.length ? pickVariant(variants, `${key}:${seed}`) : null;
  const courseExpected = expectedFor(exercise, name);
  const expected = variant?.sv ?? courseExpected;
  const meaning = variant?.en ?? meaningOf(exercise, name);
  const orderItems = isOrder ? itemsIn(expected) : [];
  const listening = activity.mode === "listen" || activity.mode === "dictation";

  // Served items land on the tray once an answer is right.
  const record: RecordFn = async (p) => {
    setAnswer(p.input === "choice" ? null : p.response);
    await round.record(p);
    const served = item ? [item] : orderItems;
    lastOrder.current = p.successful && activity.mode !== "encounter" ? orderItems : [];
    if (p.successful && activity.mode !== "encounter" && served.length) setTray((t) => [...t, ...served].slice(-6));
    setPreview([]);
  };

  const next = () => {
    setPointed(null);
    setAnswer(null);
    // Once per round, after a correct order, Bosse fumbles it and you fix it.
    if (!fixUsed.current && lastOrder.current.length && attempts.length >= 2) {
      fixUsed.current = true;
      const want = lastOrder.current[0];
      const mix = mixUp(want, attempts.length);
      setTray((t) => [...t.slice(0, -lastOrder.current.length), mix.got]);
      setFix({ ...mix, want, picked: null });
      emote(villager.id, "happy", 1200);
      void speakSwedish(mix.serve.sv, { who: villager.id, pitch: villager.voicePitch });
      return;
    }
    round.advance(queued);
  };

  let body: React.ReactNode;
  if (fix) {
    body = (
      <MixUp
        fix={fix}
        villager={villager}
        onPick={(index) => {
          const right = fix.options[index].right;
          setFix({ ...fix, picked: index });
          sound.play(right ? "correct" : "wrong");
          emote(villager.id, right ? "happy" : "think", 1500);
          if (right) setTray((t) => [...t.slice(0, -1), fix.want]);
          const reply = right ? cafeLines.sorry : cafeLines.checkOrder(fix.want);
          void speakSwedish(reply.sv, { who: villager.id, pitch: villager.voicePitch });
        }}
        onNext={() => {
          setFix(null);
          round.advance(queued);
        }}
      />
    );
  } else if (outcome) {
    body = <Feedback outcome={outcome} onNext={next} />;
  } else if (item && activity.mode === "encounter") {
    body = <MeetItem key={activity.id} item={item} expected={expected} villager={villager} busy={busy} onRecord={record} />;
  } else if (item && (activity.mode === "listen" || activity.mode === "dictation")) {
    body = null; // the counter itself is the exercise
  } else if (item) {
    body = <NameItem key={activity.id + attempts.length} item={item} expected={expected} busy={busy} onRecord={record} />;
  } else if (isOrder && activity.mode === "listen") {
    body = <TrayCheck key={key} villager={villager} busy={busy} onRecord={record} />;
  } else if (isOrder && !listening) {
    body = (
      <OrderTicket
        key={key}
        round={round}
        items={orderItems}
        expected={expected}
        meaning={meaning}
        accept={variant?.accept}
        course={expected === courseExpected}
        encounter={activity.mode === "encounter"}
        onPreview={setPreview}
        onRecord={record}
      />
    );
  } else {
    body = (
      <ActivityView
        key={activity.id + attempts.length}
        activity={activity}
        villager={villager}
        name={name}
        state={round.stateBefore}
        pool={round.scoped.map((c) => c.canonicalForm)}
        busy={busy}
        onRecord={record}
      />
    );
  }

  const pointing = !fix && !outcome && item && (activity.mode === "listen" || activity.mode === "dictation");
  return (
    <div className="lesson cafe" aria-busy={busy}>
      <div className="lesson-progress" aria-hidden="true">
        {Array.from({ length: CAFE_ROUND }, (_, i) => (
          <span key={i} className={i < attempts.length ? "is-done" : i === attempts.length ? "is-current" : ""} />
        ))}
      </div>
      {pointing ? (
        <PointAt
          key={`point:${activity.id}:${attempts.length}`}
          item={item}
          expected={expected}
          clipId={exercise.audioId}
          villager={villager}
          busy={busy}
          onRecord={(p) => {
            setPointed({ picked: cafeMenu.find((i) => i.sv === p.response)?.slug ?? "", answer: item.slug });
            return record(p);
          }}
          tray={tray}
        />
      ) : outcome && pointed ? (
        // Keep the board up so the learner sees what they tapped against what Bosse said.
        <Counter tray={tray} pick={{ hidden: false, picked: pointed.picked, answer: pointed.answer, busy: true, onPick: () => undefined }} />
      ) : (
        <Counter
          tray={tray}
          preview={preview}
          highlight={item && activity.mode === "encounter" ? item.slug : null}
          // Naming an item from its picture means the board can't show the answer.
          hideNames={Boolean(item && !outcome && !fix && activity.mode !== "encounter")}
        />
      )}
      {isOrder && !listening && activity.mode !== "encounter" && !fix ? (
        <Exchange
          key={`exchange:${key}`}
          villager={villager}
          beat={concept.slug === "cafe-ask-bill" ? billExchange : orderExchange}
          target={expected}
          answer={outcome?.correct ? answer : null}
          name={name}
        />
      ) : null}
      {body}
      {round.error ? (
        <p className="lesson-error" role="alert">
          <SvLine line={ui.error} /> <button onClick={() => round.setError(false)}><SvLine line={ui.tryAgain} /></button>
        </p>
      ) : null}
    </div>
  );
}

// ---------- The counter: menu board and tray ----------

function Counter({
  tray,
  preview = [],
  highlight = null,
  hideNames = false,
  pick,
}: {
  tray: CafeItem[];
  preview?: CafeItem[];
  highlight?: string | null;
  hideNames?: boolean;
  pick?: { hidden: boolean; picked: string | null; answer: string; onPick: (item: CafeItem) => void; busy: boolean };
}) {
  const ghosts = preview.filter((p, i) => preview.findIndex((q) => q.slug === p.slug) === i);
  return (
    <div className="cafe-counter">
      <div className="cafe-board" role={pick ? "group" : undefined} aria-label="Meny (menu)">
        <SvLine line={cafeLines.menu} className="cafe-board-title" />
        <div className="cafe-board-items">
          {cafeMenu.map((entry) => {
            const state = pick?.picked
              ? entry.slug === pick.answer
                ? "is-right"
                : entry.slug === pick.picked
                  ? "is-wrong"
                  : ""
              : "";
            const content = (
              <>
                <CafeIconArt icon={entry.icon} />
                <span className="cafe-item-name">{hideNames || (pick?.hidden && !pick.picked) ? "?" : <Sv text={entry.sv} en={entry.en} />}</span>
                <SvLine line={priceLine(entry)} className="cafe-item-price" />
              </>
            );
            return pick ? (
              <button
                key={entry.slug}
                className={`cafe-item is-pickable ${state}`}
                disabled={pick.busy || pick.picked !== null}
                onClick={() => pick.onPick(entry)}
                aria-label={pick.hidden ? `Alternativ (option): ${entry.en}` : entry.sv}
              >
                {content}
              </button>
            ) : (
              <div key={entry.slug} className={`cafe-item ${highlight === entry.slug ? "is-highlight" : ""}`}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
      <div className="cafe-tray" aria-label="Din bricka (your tray)">
        <SvLine line={cafeLines.yourTray} className="cafe-board-title" />
        <div className="cafe-tray-items">
          {tray.length === 0 && ghosts.length === 0 ? <span className="cafe-tray-empty">…</span> : null}
          {tray.map((entry, i) => (
            <span key={`${entry.slug}-${i}`} className="cafe-served" title={entry.sv}>
              <CafeIconArt icon={entry.icon} />
            </span>
          ))}
          {ghosts.map((entry) => (
            <span key={`ghost-${entry.slug}`} className="cafe-served is-ghost" title={entry.sv}>
              <CafeIconArt icon={entry.icon} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Beats ----------

function MeetItem({
  item,
  expected,
  villager,
  busy,
  onRecord,
}: {
  item: CafeItem;
  expected: string;
  villager: Villager;
  busy: boolean;
  onRecord: RecordFn;
}) {
  const line = introduceLine(item);
  const play = useCallback(
    (slow = false) => void speakSwedish(line.sv, { who: villager.id, pitch: villager.voicePitch, slow }),
    [line.sv, villager],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => play(), 350);
    emote(villager.id, "wave", 1200);
    return () => window.clearTimeout(timer);
  }, [play, villager.id]);
  return (
    <div className="activity">
      <p className="activity-kicker">
        <SvLine line={ui.newPhrase} />
      </p>
      <div className="cafe-hero">
        <CafeIconArt icon={item.icon} />
        <div>
          <Sv text={line.sv} en={line.en} as="h3" />
          <p className="activity-meaning">
            {line.en} · <Sv text={withArticle(item)} en={item.en} />
          </p>
        </div>
        <ListenButtons onPlay={play} />
      </div>
      <SayItPractice expected={expected} />
      <div className="dialogue-actions">
        <button
          className="btn btn-primary"
          disabled={busy}
          autoFocus
          onClick={() => void onRecord({ successful: true, assisted: true, response: "", expected, check: "exact", replays: 0, input: "text" })}
        >
          <SvLine line={ui.next} /> <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function PointAt({
  item,
  expected,
  clipId,
  villager,
  busy,
  onRecord,
  tray,
}: {
  item: CafeItem;
  expected: string;
  clipId: string;
  villager: Villager;
  busy: boolean;
  onRecord: RecordFn;
  tray: CafeItem[];
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const replays = useRef(0);
  const play = useCallback(
    (slow = false) => {
      replays.current++;
      void speakSwedish(expected, { clipId, who: villager.id, pitch: villager.voicePitch, slow });
    },
    [expected, clipId, villager],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => play(), 350);
    return () => window.clearTimeout(timer);
  }, [play]);
  return (
    <>
      <div className="activity cafe-point-head">
        <p className="activity-kicker">
          <SvLine line={cafeLines.tapWhatYouHear} />
        </p>
        <ListenButtons onPlay={play} />
      </div>
      <Counter
        tray={tray}
        pick={{
          hidden: true,
          picked,
          answer: item.slug,
          busy,
          onPick: (choice) => {
            setPicked(choice.slug);
            void onRecord({
              successful: choice.slug === item.slug,
              assisted: false,
              response: choice.sv,
              expected,
              check: "choice",
              replays: Math.max(0, replays.current - 1),
              input: "choice",
            });
          },
        }}
      />
    </>
  );
}

function NameItem({ item, expected, busy, onRecord }: { item: CafeItem; expected: string; busy: boolean; onRecord: RecordFn }) {
  return (
    <div className="activity">
      <p className="activity-kicker">
        <SvLine line={cafeLines.whatIsThis} />
      </p>
      <div className="cafe-hero">
        <CafeIconArt icon={item.icon} />
        <p className="activity-meaning">Bosse holds something up. Say it in Swedish!</p>
      </div>
      <FreeAnswer
        busy={busy}
        hint={withArticle(item)}
        onSubmit={(answer, via, hinted) => {
          // "kaffe", "en kaffe" and "Kaffe!" are all fine.
          const checks = [checkAnswer(answer, expected), checkAnswer(answer, withArticle(item))];
          const check = checks.find((c) => c !== "wrong") ?? "wrong";
          return onRecord({ successful: check !== "wrong", assisted: hinted, response: answer, expected, check, replays: 0, input: via });
        }}
      />
    </div>
  );
}

function OrderTicket({
  round,
  items,
  expected,
  meaning,
  accept,
  course,
  encounter,
  onPreview,
  onRecord,
}: {
  round: ReturnType<typeof useLessonRound>;
  items: CafeItem[];
  expected: string;
  meaning: string;
  accept?: string[];
  course: boolean;
  encounter: boolean;
  onPreview: (items: CafeItem[]) => void;
  onRecord: RecordFn;
}) {
  const { activity, busy, stateBefore, scoped } = round;
  const pool = useMemo(() => scoped.map((c) => c.canonicalForm), [scoped]);
  const preview = useCallback((answer: string) => onPreview(itemsIn(answer)), [onPreview]);
  useEffect(() => {
    if (encounter) onPreview(items);
  }, [encounter, items, onPreview]);
  if (!activity) return null;
  const bill = items.length === 0;

  const ticket = (
    <div className="cafe-ticket">
      {bill ? <Receipt size={34} /> : items.map((entry, i) => <CafeIconArt key={`${entry.slug}-${i}`} icon={entry.icon} />)}
      <span className="cafe-ticket-en">“{meaning}”</span>
    </div>
  );

  if (encounter) {
    return (
      <div className="activity">
        <p className="activity-kicker">
          <SvLine line={cafeLines.howToOrder} />
        </p>
        {ticket}
        <div className="activity-phrase">
          <Sv text={expected} en={meaning} as="h3" />
          <ListenButtons onPlay={(slow) => void speakSwedish(expected, { clipId: course ? activity.exercise.audioId : undefined, slow })} />
        </div>
        <SayItPractice expected={expected} />
        <div className="dialogue-actions">
          <button
            className="btn btn-primary"
            disabled={busy}
            autoFocus
            onClick={() => void onRecord({ successful: true, assisted: true, response: "", expected, check: "exact", replays: 0, input: "text" })}
          >
            <SvLine line={ui.next} /> <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const useTiles = (stateBefore?.recall ?? null) === null;
  // The exact order, another natural way to order it, or (for the course's own
  // sentence) whatever the evaluator accepts as doing the job.
  const judge = async (answer: string) => {
    const check = checkAnswer(answer, expected);
    if (check !== "wrong") return { successful: true, check };
    if (acceptsAnswer(accept, answer)) return { successful: true, check: "exact" as const };
    if (course) return judgeAnswer(activity, answer, expected);
    return { successful: false, check };
  };
  return (
    <div className="activity">
      <p className="activity-kicker">
        <SvLine line={bill ? { sv: "Be om notan!", en: "Ask for the bill!" } : cafeLines.orderThis} />
      </p>
      {ticket}
      {useTiles ? (
        <Tiles
          expected={expected}
          pool={pool}
          busy={busy}
          onChange={preview}
          onSubmit={async (answer) => {
            const { successful, check } = await judge(answer);
            return onRecord({ successful, assisted: false, response: answer, expected, check, replays: 0, input: "tiles" });
          }}
        />
      ) : (
        <FreeAnswer
          busy={busy}
          hint={expected}
          onChange={preview}
          onSubmit={async (answer, via, hinted) => {
            const { successful, check } = await judge(answer);
            return onRecord({ successful, assisted: hinted, response: answer, expected, check, replays: 0, input: via });
          }}
        />
      )}
    </div>
  );
}

// Listen to a customer's order and fill their tray: tap everything they asked for.
function TrayCheck({ villager, busy, onRecord }: { villager: Villager; busy: boolean; onRecord: RecordFn }) {
  const [order] = useState(() => trayOrders[Math.floor(Math.random() * trayOrders.length)]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const replays = useRef(0);
  const play = useCallback(
    (slow = false) => {
      replays.current++;
      void speakSwedish(order.sv, { pitch: 1.15, slow });
    },
    [order.sv],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => play(), 350);
    return () => window.clearTimeout(timer);
  }, [play]);
  const want = new Set(order.items);
  return (
    <div className="activity">
      <p className="scene-situation">A customer orders while {villager.name} is busy. Fill their tray!</p>
      <div className="cafe-point-head">
        <p className="activity-kicker">
          <Sv text="Fyll brickan!" en="Fill the tray!" />
        </p>
        <ListenButtons onPlay={play} />
      </div>
      <div className="cafe-tray-pick">
        {cafeMenu.map((entry) => {
          const on = chosen.includes(entry.slug);
          const state = done ? (want.has(entry.slug) ? "is-right" : on ? "is-wrong" : "") : on ? "is-on" : "";
          return (
            <button
              key={entry.slug}
              className={`cafe-item is-pickable ${state}`}
              aria-pressed={on}
              disabled={busy || done}
              onClick={() => {
                sound.play("tile");
                setChosen((c) => (on ? c.filter((s) => s !== entry.slug) : [...c, entry.slug]));
              }}
            >
              <CafeIconArt icon={entry.icon} />
              <span className="cafe-item-name">
                <Sv text={entry.sv} en={entry.en} />
              </span>
            </button>
          );
        })}
      </div>
      {done ? (
        <p className="scene-reveal">
          <Sv text={order.sv} en={order.en} /> <span className="scene-line-en">{order.en}</span>
        </p>
      ) : (
        <div className="dialogue-actions">
          <button
            className="btn btn-primary"
            disabled={busy || chosen.length === 0}
            onClick={() => {
              setDone(true);
              const right = chosen.length === want.size && chosen.every((s) => want.has(s));
              void onRecord({
                successful: right,
                assisted: false,
                response: chosen.map((s) => cafeItem(s)!.sv).join(", "),
                expected: order.sv,
                check: "choice",
                replays: Math.max(0, replays.current - 1),
                input: "choice",
              });
            }}
          >
            <Sv text="Klar!" en="Done!" />
          </button>
        </div>
      )}
    </div>
  );
}

function MixUp({
  fix,
  villager,
  onPick,
  onNext,
}: {
  fix: ReturnType<typeof mixUp> & { want: CafeItem; picked: number | null };
  villager: Villager;
  onPick: (index: number) => void;
  onNext: () => void;
}) {
  const [order] = useState(() => [0, 1, 2].sort(() => Math.random() - 0.5));
  const picked = fix.picked;
  const reply: Line | null = picked === null ? null : fix.options[picked].right ? cafeLines.sorry : cafeLines.checkOrder(fix.want);
  return (
    <div className="activity">
      <p className="activity-kicker">
        <SvLine line={cafeLines.oops} />
      </p>
      <div className="cafe-hero">
        <CafeIconArt icon={fix.got.icon} />
        <div>
          <Sv text={fix.serve.sv} en={fix.serve.en} as="h3" />
          <p className="activity-meaning">
            {villager.name} brought the wrong thing. You wanted <Sv text={withArticle(fix.want)} en={fix.want.en} />. What do you say?
          </p>
        </div>
      </div>
      <div className="choice-grid">
        {order.map((index) => {
          const option = fix.options[index];
          const state = picked === null ? "" : option.right ? "is-right" : index === picked ? "is-wrong" : "is-dim";
          return (
            <button key={index} className={`btn choice ${state}`} disabled={picked !== null} onClick={() => onPick(index)}>
              <Sv text={option.sv} en={option.en} />
            </button>
          );
        })}
      </div>
      {reply ? (
        <>
          <p className={`grammar-why ${picked !== null && fix.options[picked].right ? "is-right" : ""}`} role="status">
            <Sv text={reply.sv} en={reply.en} />
          </p>
          <div className="dialogue-actions">
            <button className="btn btn-primary" autoFocus onClick={onNext}>
              <SvLine line={ui.next} /> <ArrowRight size={18} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---------- Art ----------

export function CafeIconArt({ icon }: { icon: CafeIcon }) {
  return (
    <svg className="cafe-icon" viewBox="0 0 48 48" aria-hidden="true">
      {icon === "coffee" ? (
        <>
          <path d="M17 9c-2 3 2 4 0 7M24 8c-2 3 2 4 0 7M31 9c-2 3 2 4 0 7" stroke="#b9a58f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M9 20h26v9a11 11 0 0 1-11 11h-4A11 11 0 0 1 9 29z" fill="#fff" stroke="#6b4a2f" strokeWidth="2.5" />
          <path d="M35 23h2a5 5 0 0 1 0 10h-3" fill="none" stroke="#6b4a2f" strokeWidth="2.5" />
          <ellipse cx="22" cy="21" rx="11" ry="2.4" fill="#7a4b2f" />
        </>
      ) : icon === "tea" ? (
        <>
          <path d="M9 18h26v11a11 11 0 0 1-11 11h-4A11 11 0 0 1 9 29z" fill="#fff" stroke="#3f7d4f" strokeWidth="2.5" />
          <path d="M35 21h2a5 5 0 0 1 0 10h-3" fill="none" stroke="#3f7d4f" strokeWidth="2.5" />
          <ellipse cx="22" cy="19" rx="11" ry="2.4" fill="#c79a45" />
          <path d="M26 19V9" stroke="#8a7a6a" strokeWidth="1.6" />
          <rect x="23" y="5" width="7" height="6" rx="1.5" fill="#6fae4f" />
        </>
      ) : icon === "water" ? (
        <>
          <path d="M13 8h22l-3 32H16z" fill="#dff2fb" stroke="#3f7fd1" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M15 18h18l-2 20H17z" fill="#8fd0f0" />
          <circle cx="21" cy="26" r="1.6" fill="#fff" />
          <circle cx="26" cy="31" r="1.2" fill="#fff" />
        </>
      ) : icon === "milk" ? (
        <>
          <path d="M16 14l4-6h8l4 6v26H16z" fill="#fff" stroke="#3f7fd1" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M16 24h16v8H16z" fill="#3f7fd1" />
          <path d="M20 8h8" stroke="#3f7fd1" strokeWidth="2.5" />
        </>
      ) : (
        <>
          <ellipse cx="24" cy="30" rx="17" ry="10" fill="#d9954b" stroke="#8a5327" strokeWidth="2.5" />
          <path d="M24 30c0-3 5-3 5 0s-7 5-9 0 5-10 12-5 5 13-6 12" fill="none" stroke="#8a5327" strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="17" cy="25" r="1" fill="#fff" />
          <circle cx="31" cy="27" r="1" fill="#fff" />
          <circle cx="23" cy="36" r="1" fill="#fff" />
        </>
      )}
    </svg>
  );
}
