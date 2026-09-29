"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Receipt } from "lucide-react";
import { cafeItem, itemsIn, mixUp, type CafeIcon, type CafeItem } from "@/lib/game/cafe";
import { checkAnswer, expectedFor, meaningOf } from "@/lib/game/lesson";
import type { Line } from "@/lib/game/line";
import { acceptsAnswer, pickVariant } from "@/lib/game/scenes";
import { aria } from "@/lib/game/ui-text";
import type { Villager } from "@/lib/game/villagers";
import type { AdaptiveActivity } from "@/lib/learning/adaptive";
import { getTargetLanguage } from "@/lib/learning/languages";
import type { LearnerConceptState } from "@/types/learning";
import { sound } from "../audio/sfx";
import { speak } from "../audio/speech";
import { island, useIsland } from "../island";
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
import { Glossed, GlossedLine } from "./glossed";
import { LessonSide, LessonTopBar } from "./lesson-layout";

const CAFE_ROUND = 6;

const cafe = () => island().cafe!;

// Menu words and orders have few listening drills in the course, so the
// counter supplies them: point at the item you hear, or fill a customer's tray
// from what they order, whenever hearing lags behind saying.
function pointWhenListeningLags(activity: AdaptiveActivity | null, states: LearnerConceptState[]) {
  if (!activity || activity.mode !== "recall") return activity;
  const isItem = Boolean(cafeItemByConcept(activity));
  if (!isItem && !cafe().orderSlugs.includes(activity.exercise.conceptSlug)) return activity;
  const state = states.find((s) => s.conceptId === activity.conceptId);
  const floor = isItem ? 0.45 : 0;
  const lagging = (state?.recognitionAudio ?? 0) < Math.max(floor, (state?.recall ?? 0) - 0.15);
  return lagging ? { ...activity, id: activity.id.replace(":recall:", ":listen:"), mode: "listen" as const } : activity;
}

const cafeItemByConcept = (activity: AdaptiveActivity) => cafeItem(cafe(), activity.exercise.conceptSlug);

// A café host teaches at their counter: the same adaptive schedule as every
// lesson, played out with the menu board, a tray that fills with what you
// order, and the occasional mix-up for you to sort out.
export function CafeRound({ villager, slugs, onFinish }: { villager: Villager; slugs: readonly string[]; onFinish: (summary: RoundSummary) => void }) {
  const { code, ui } = useIsland();
  const round = useLessonRound(villager, slugs, onFinish, { roundLength: CAFE_ROUND, later: cafe().later, adapt: pointWhenListeningLags });
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
      <div className="lesson">
        <div className="lesson-task">
          <div className="dialogue-actions">
            <button className="btn btn-primary" autoFocus onClick={() => onFinish(summary.current)}>
              <GlossedLine line={ui.next} /> <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const exercise = activity.exercise;
  // Stable for one activity, from its prompt through its feedback.
  const key = `${activity.id}:${attempts.length - (outcome ? 1 : 0)}`;
  const item = cafeItem(cafe(), concept.slug);
  const isOrder = cafe().orderSlugs.includes(concept.slug);
  // Orders come in several variants (other drinks, other buns) so tickets rarely repeat.
  const variants = isOrder ? cafe().orderVariants[concept.slug] ?? [] : [];
  const variant = variants.length ? pickVariant(variants, `${key}:${seed}`) : null;
  const courseExpected = expectedFor(exercise, name);
  const expected = variant?.t ?? courseExpected;
  const meaning = variant?.en ?? meaningOf(exercise, name);
  const orderItems = isOrder ? itemsIn(cafe(), expected, code) : [];
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
    // Once per round, after a correct order, the host fumbles it and you fix it.
    if (!fixUsed.current && lastOrder.current.length && attempts.length >= 2) {
      fixUsed.current = true;
      const want = lastOrder.current[0];
      const mix = mixUp(cafe(), want, attempts.length);
      setTray((t) => [...t.slice(0, -lastOrder.current.length), mix.got]);
      setFix({ ...mix, want, picked: null });
      emote(villager.id, "happy", 1200);
      void speak(mix.serve.t, { who: villager.id, pitch: villager.voicePitch });
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
          const reply = right ? cafe().lines.sorry : cafe().checkOrder(fix.want);
          void speak(reply.t, { who: villager.id, pitch: villager.voicePitch });
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
    body = <NameItem key={activity.id + attempts.length} item={item} expected={expected} villager={villager} busy={busy} onRecord={record} />;
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
  // The menu board is the answer when pointing at what you heard; otherwise it
  // is reference, and waits in the drawer with the tray.
  const boardInTask = pointing || Boolean(outcome && pointed);
  return (
    <div className="lesson cafe" aria-busy={busy}>
      <LessonTopBar length={CAFE_ROUND} done={attempts.length} />
      <LessonSide>
        {boardInTask ? null : (
          <Counter
            highlight={item && activity.mode === "encounter" ? item.slug : null}
            // Naming an item from its picture means the board can't show the answer.
            hideNames={Boolean(item && !outcome && !fix && activity.mode !== "encounter")}
          />
        )}
        <CafeTray tray={tray} preview={preview} />
      </LessonSide>
      {isOrder && !listening && activity.mode !== "encounter" && !fix ? (
        <Exchange
          key={`exchange:${key}`}
          villager={villager}
          beat={concept.slug === cafe().billSlug ? cafe().billExchange : cafe().orderExchange}
          target={expected}
          answer={outcome?.correct ? answer : null}
          name={name}
        />
      ) : null}
      <div className="lesson-task">
        {pointing ? (
          <PointAt
            key={`point:${activity.id}:${attempts.length}`}
            item={item}
            expected={expected}
            clipId={exercise.audioId}
            villager={villager}
            busy={busy}
            onRecord={(p) => {
              setPointed({ picked: cafe().menu.find((i) => i.name === p.response)?.slug ?? "", answer: item.slug });
              return record(p);
            }}
          />
        ) : outcome && pointed ? (
          // Keep the board up so the learner sees what they tapped against what the host said.
          <Counter pick={{ hidden: false, picked: pointed.picked, answer: pointed.answer, busy: true, onPick: () => undefined }} />
        ) : null}
        {body}
        {round.error ? (
          <p className="lesson-error" role="alert">
            <GlossedLine line={ui.error} /> <button onClick={() => round.setError(false)}><GlossedLine line={ui.tryAgain} /></button>
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ---------- The counter: menu board and tray ----------

function CafeTray({ tray, preview }: { tray: CafeItem[]; preview: CafeItem[] }) {
  const { ui } = useIsland();
  const ghosts = preview.filter((p, i) => preview.findIndex((q) => q.slug === p.slug) === i);
  return (
    <div className="cafe-tray" aria-label={aria(ui.yourTray)}>
      <GlossedLine line={ui.yourTray} className="cafe-board-title" />
      <div className="cafe-tray-items">
        {tray.length === 0 && ghosts.length === 0 ? <span className="cafe-tray-empty">…</span> : null}
        {tray.map((entry, i) => (
          <span key={`${entry.slug}-${i}`} className="cafe-served" title={entry.name}>
            <CafeIconArt icon={entry.icon} />
          </span>
        ))}
        {ghosts.map((entry) => (
          <span key={`ghost-${entry.slug}`} className="cafe-served is-ghost" title={entry.name}>
            <CafeIconArt icon={entry.icon} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Counter({
  highlight = null,
  hideNames = false,
  pick,
}: {
  highlight?: string | null;
  hideNames?: boolean;
  pick?: { hidden: boolean; picked: string | null; answer: string; onPick: (item: CafeItem) => void; busy: boolean };
}) {
  const { ui } = useIsland();
  return (
    <div className="cafe-counter">
      <div className="cafe-board" role={pick ? "group" : undefined} aria-label={aria(cafe().lines.menu)}>
        <GlossedLine line={cafe().lines.menu} className="cafe-board-title" />
        <div className="cafe-board-items">
          {cafe().menu.map((entry) => {
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
                <span className="cafe-item-name">{hideNames || (pick?.hidden && !pick.picked) ? "?" : <Glossed text={entry.name} en={entry.en} />}</span>
                <GlossedLine line={cafe().price(entry)} className="cafe-item-price" />
              </>
            );
            return pick ? (
              <button
                key={entry.slug}
                className={`cafe-item is-pickable ${state}`}
                disabled={pick.busy || pick.picked !== null}
                onClick={() => pick.onPick(entry)}
                aria-label={pick.hidden ? `${aria(ui.option)}: ${entry.en}` : entry.name}
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
  const { ui } = useIsland();
  const line = cafe().introduce(item);
  const play = useCallback(
    (slow = false) => void speak(line.t, { who: villager.id, pitch: villager.voicePitch, slow }),
    [line.t, villager],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => play(), 350);
    emote(villager.id, "wave", 1200);
    return () => window.clearTimeout(timer);
  }, [play, villager.id]);
  return (
    <div className="activity">
      <p className="activity-kicker">
        <GlossedLine line={ui.newPhrase} />
      </p>
      <div className="cafe-hero">
        <CafeIconArt icon={item.icon} />
        <div>
          <Glossed text={line.t} en={line.en} as="h3" />
          <p className="activity-meaning">
            {line.en} · <Glossed text={cafe().withArticle(item)} en={item.en} />
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
          <GlossedLine line={ui.next} /> <ArrowRight size={18} />
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
}: {
  item: CafeItem;
  expected: string;
  clipId: string;
  villager: Villager;
  busy: boolean;
  onRecord: RecordFn;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const replays = useRef(0);
  const play = useCallback(
    (slow = false) => {
      replays.current++;
      void speak(expected, { clipId, who: villager.id, pitch: villager.voicePitch, slow });
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
          <GlossedLine line={cafe().lines.tapWhatYouHear} />
        </p>
        <ListenButtons onPlay={play} />
      </div>
      <Counter
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
              response: choice.name,
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

function NameItem({ item, expected, villager, busy, onRecord }: { item: CafeItem; expected: string; villager: Villager; busy: boolean; onRecord: RecordFn }) {
  const code = island().code;
  return (
    <div className="activity">
      <p className="activity-kicker">
        <GlossedLine line={cafe().lines.whatIsThis} />
      </p>
      <div className="cafe-hero">
        <CafeIconArt icon={item.icon} />
        <p className="activity-meaning">{villager.name} holds something up. Say it in {getTargetLanguage(code).name}!</p>
      </div>
      <FreeAnswer
        busy={busy}
        hint={cafe().withArticle(item)}
        onSubmit={(answer, via, hinted) => {
          // "kaffe", "en kaffe" and "Kaffe!" are all fine.
          const checks = [checkAnswer(answer, expected, code), checkAnswer(answer, cafe().withArticle(item), code)];
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
  const { code, ui } = useIsland();
  const pool = useMemo(() => scoped.map((c) => c.canonicalForm), [scoped]);
  const preview = useCallback((answer: string) => onPreview(itemsIn(cafe(), answer, code)), [onPreview, code]);
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
          <GlossedLine line={cafe().lines.howToOrder} />
        </p>
        {ticket}
        <div className="activity-phrase">
          <Glossed text={expected} en={meaning} as="h3" />
          <ListenButtons onPlay={(slow) => void speak(expected, { clipId: course ? activity.exercise.audioId : undefined, slow })} />
        </div>
        <SayItPractice expected={expected} />
        <div className="dialogue-actions">
          <button
            className="btn btn-primary"
            disabled={busy}
            autoFocus
            onClick={() => void onRecord({ successful: true, assisted: true, response: "", expected, check: "exact", replays: 0, input: "text" })}
          >
            <GlossedLine line={ui.next} /> <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const useTiles = (stateBefore?.recall ?? null) === null;
  // The exact order, another natural way to order it, or (for the course's own
  // sentence) whatever the evaluator accepts as doing the job.
  const judge = async (answer: string) => {
    const check = checkAnswer(answer, expected, code);
    if (check !== "wrong") return { successful: true, check };
    if (acceptsAnswer(accept, answer, code)) return { successful: true, check: "exact" as const };
    if (course) return judgeAnswer(activity, answer, expected);
    return { successful: false, check };
  };
  return (
    <div className="activity">
      <p className="activity-kicker">
        <GlossedLine line={bill ? ui.askForBill : cafe().lines.orderThis} />
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
  const { ui } = useIsland();
  const [order] = useState(() => cafe().trayOrders[Math.floor(Math.random() * cafe().trayOrders.length)]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const replays = useRef(0);
  const play = useCallback(
    (slow = false) => {
      replays.current++;
      void speak(order.t, { pitch: 1.15, slow });
    },
    [order.t],
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
          <GlossedLine line={ui.fillTray} />
        </p>
        <ListenButtons onPlay={play} />
      </div>
      <div className="cafe-tray-pick">
        {cafe().menu.map((entry) => {
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
                <Glossed text={entry.name} en={entry.en} />
              </span>
            </button>
          );
        })}
      </div>
      {done ? (
        <p className="scene-reveal">
          <Glossed text={order.t} en={order.en} /> <span className="scene-line-en">{order.en}</span>
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
                response: chosen.map((s) => cafeItem(cafe(), s)!.name).join(", "),
                expected: order.t,
                check: "choice",
                replays: Math.max(0, replays.current - 1),
                input: "choice",
              });
            }}
          >
            <GlossedLine line={ui.ready} />
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
  const { ui } = useIsland();
  const [order] = useState(() => [0, 1, 2].sort(() => Math.random() - 0.5));
  const picked = fix.picked;
  const reply: Line | null = picked === null ? null : fix.options[picked].right ? cafe().lines.sorry : cafe().checkOrder(fix.want);
  return (
    <div className="activity">
      <p className="activity-kicker">
        <GlossedLine line={cafe().lines.oops} />
      </p>
      <div className="cafe-hero">
        <CafeIconArt icon={fix.got.icon} />
        <div>
          <Glossed text={fix.serve.t} en={fix.serve.en} as="h3" />
          <p className="activity-meaning">
            {villager.name} brought the wrong thing. You wanted <Glossed text={cafe().withArticle(fix.want)} en={fix.want.en} />. What do you say?
          </p>
        </div>
      </div>
      <div className="choice-grid">
        {order.map((index) => {
          const option = fix.options[index];
          const state = picked === null ? "" : option.right ? "is-right" : index === picked ? "is-wrong" : "is-dim";
          return (
            <button key={index} className={`btn choice ${state}`} disabled={picked !== null} onClick={() => onPick(index)}>
              <Glossed text={option.t} en={option.en} />
            </button>
          );
        })}
      </div>
      {reply ? (
        <>
          <p className={`grammar-why ${picked !== null && fix.options[picked].right ? "is-right" : ""}`} role="status">
            <Glossed text={reply.t} en={reply.en} />
          </p>
          <div className="dialogue-actions">
            <button className="btn btn-primary" autoFocus onClick={onNext}>
              <GlossedLine line={ui.next} /> <ArrowRight size={18} />
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
      ) : icon === "pretzel" ? (
        <>
          <path
            d="M24 38c-8-6-15-12-15-20 0-6 5-9 9-6s6 10 6 14c0-4 2-11 6-14s9 0 9 6c0 8-7 14-15 20z"
            fill="none"
            stroke="#8a4b22"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M14 36l20-14M34 36L14 22" stroke="#8a4b22" strokeWidth="5.5" strokeLinecap="round" />
          {[
            [13, 17],
            [33, 15],
            [22, 30],
            [30, 31],
          ].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="0.9" fill="#fff" />
          ))}
        </>
      ) : icon === "cake" ? (
        <>
          <path d="M8 22l32 0-4 18H12z" fill="#5a2e1c" stroke="#3b1d10" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 22h32v5H8z" fill="#fff4ea" />
          <path d="M9 32h30" stroke="#fff4ea" strokeWidth="3" />
          <path d="M8 22c4-5 28-5 32 0" fill="#fff" stroke="#e4d6c8" strokeWidth="1.5" />
          <circle cx="24" cy="15" r="4" fill="#c0392b" />
          <path d="M24 11c1-3 3-4 5-4" stroke="#3f7d4f" strokeWidth="1.6" fill="none" />
        </>
      ) : icon === "juice" ? (
        <>
          <path d="M14 10h20l-3 30H17z" fill="#fff4d6" stroke="#e08a1e" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M15.5 18h17l-2 20h-13z" fill="#f7a531" />
          <path d="M28 10l5-6" stroke="#3f7fd1" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="36" cy="12" r="5" fill="#f7a531" stroke="#e08a1e" strokeWidth="1.5" />
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
