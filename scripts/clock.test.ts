import assert from "node:assert/strict";
import { test } from "node:test";

import { clock as de } from "../src/content/de/clock";
import { clock as sv } from "../src/content/sv/clock";
import { allTimes, CLOCK_LEVELS, clockStars, makeCalendar, makeCustomers, namedHour, sameTime, turn, type TimeForm } from "../src/lib/game/clock";

const allForms: TimeForm[] = ["oclock", "half", "past", "to"];
const allHours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const days = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag"];

test("times are said the German way", () => {
  assert.equal(de.say({ h: 3, m: 0 }).t, "drei Uhr");
  assert.equal(de.say({ h: 1, m: 0 }).t, "ein Uhr");
  assert.equal(de.say({ h: 3, m: 30 }).t, "halb vier");
  assert.equal(de.say({ h: 12, m: 30 }).t, "halb eins");
  assert.equal(de.say({ h: 2, m: 15 }).t, "Viertel nach zwei");
  assert.equal(de.say({ h: 7, m: 45 }).t, "Viertel vor acht");
  assert.equal(de.say({ h: 3, m: 30 }).en, "half past three");
  assert.equal(namedHour({ h: 12, m: 45 }), 1);
});

test("what the learner says is read back as a time", () => {
  for (const time of allTimes()) {
    const said = de.say(time).t;
    assert.deepEqual(de.parse(`Es ist ${said}.`, "de"), time, said);
  }
  assert.deepEqual(de.parse("halb funf", "de"), { h: 4, m: 30 });
  assert.equal(de.parse("15:30", "de"), "digits");
  assert.equal(de.parse("keine Ahnung", "de"), null);
});

test("turning the hands carries the hour along", () => {
  assert.deepEqual(turn({ h: 3, m: 45 }, "minute", 1), { h: 4, m: 0 });
  assert.deepEqual(turn({ h: 12, m: 45 }, "minute", 1), { h: 1, m: 0 });
  assert.deepEqual(turn({ h: 1, m: 0 }, "minute", -1), { h: 12, m: 45 });
  assert.deepEqual(turn({ h: 12, m: 30 }, "hour", 1), { h: 1, m: 30 });
  assert.deepEqual(turn({ h: 1, m: 0 }, "hour", -1), { h: 12, m: 0 });
});

test("customers only use the forms of a rung and the hours the learner knows", () => {
  const calendar = makeCalendar(de, 5);
  for (let seed = 1; seed < 200; seed++) {
    const first = makeCustomers(de, calendar, { level: CLOCK_LEVELS[0], forms: allForms, hours: [3, 4], days, appointments: true, seed });
    assert.equal(first.length, CLOCK_LEVELS[0].customers);
    for (const c of first) {
      assert.ok([0, 30].includes(c.set.m));
      assert.ok([3, 4].includes(namedHour(c.set)), JSON.stringify(c.set));
      assert.equal(c.tell, null);
      assert.equal(c.appointment, null);
    }
    // Never the same time twice running.
    for (let i = 1; i < first.length; i++) assert.ok(!sameTime(first[i - 1].set, first[i].set));
  }
  const late = Array.from({ length: 30 }, (_, seed) => makeCustomers(de, calendar, { level: CLOCK_LEVELS[4], forms: allForms, hours: allHours, days, appointments: true, seed })).flat();
  assert.ok(late.every((c) => c.set.m !== 0 && c.appointment));
  assert.ok(late.some((c) => c.tell));
  // Appointments agree with the calendar.
  for (const c of late) assert.equal(c.appointment!.free, !(calendar[c.appointment!.day.slug] ?? []).includes(c.appointment!.hour));
  assert.ok(late.some((c) => c.appointment!.free) && late.some((c) => !c.appointment!.free));
});

test("wrong times are named back", () => {
  assert.equal(de.wrongTime({ h: 3, m: 30 }, { h: 4, m: 30 }).t, "Nein, das ist halb fünf! Ich brauche halb vier.");
  assert.deepEqual(de.wrongTime({ h: 3, m: 30 }, { h: 4, m: 30 }).parts, ["Nein, das ist halb fünf!", "Ich brauche halb vier."]);
  assert.ok(sameTime({ h: 3, m: 30 }, { h: 3, m: 30 }));
});

test("stars", () => {
  assert.equal(clockStars(4, 4, 0.5), 3);
  assert.equal(clockStars(4, 4, 0.1), 2);
  assert.equal(clockStars(2, 4, 0), 1);
});

test("Swedish times, the same half-past trap", () => {
  assert.equal(sv.say({ h: 3, m: 30 }).t, "halv fyra");
  assert.equal(sv.say({ h: 2, m: 15 }).t, "kvart över två");
  assert.equal(sv.say({ h: 5, m: 45 }).t, "kvart i sex");
  assert.equal(sv.say({ h: 1, m: 0 }).t, "klockan ett");
  for (const time of allTimes()) assert.deepEqual(sv.parse(`Klockan är ${sv.say(time).t.replace(/^klockan /, "")}`, "sv"), time, sv.say(time).t);
  assert.deepEqual(sv.parse("kvart over tva", "sv"), { h: 2, m: 15 });
});
