import { test } from "node:test";
import assert from "node:assert/strict";
import { age, clock, remaining, rovingNext, segments } from "../components/kit/logic.ts";

test("arrow keys wrap across the dock; other keys do nothing", () => {
  assert.equal(rovingNext(0, 4, "ArrowRight"), 1);
  assert.equal(rovingNext(3, 4, "ArrowRight"), 0);
  assert.equal(rovingNext(0, 4, "ArrowLeft"), 3);
  assert.equal(rovingNext(2, 4, "Home"), 0);
  assert.equal(rovingNext(0, 4, "End"), 3);
  assert.equal(rovingNext(1, 4, "Enter"), null);
  assert.equal(rovingNext(0, 0, "ArrowRight"), null);
});

test("clock reads m:ss and never shows NaN", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(9.9), "0:09");
  assert.equal(clock(75), "1:15");
  assert.equal(clock(NaN), "0:00");
  assert.equal(clock(Infinity), "0:00");
});

test("age is short and local", () => {
  const now = Date.parse("2026-10-24T12:00:00Z");
  assert.equal(age("2026-10-24T11:59:30Z", now, "ko"), "방금");
  assert.equal(age("2026-10-24T11:57:00Z", now, "ko"), "3분");
  assert.equal(age("2026-10-24T09:00:00Z", now, "en"), "3h");
  assert.equal(age("2026-10-21T12:00:00Z", now), "3d");
  assert.equal(age("not a date", now), "");
});

test("spend left is clamped and warns at a fifth", () => {
  assert.deepEqual(remaining(31, 40), { left: 9, pct: 23, low: false });
  assert.deepEqual(remaining(32, 40), { left: 8, pct: 20, low: true });
  assert.deepEqual(remaining(50, 40), { left: 0, pct: 0, low: true });
  assert.deepEqual(remaining(-5, 40), { left: 40, pct: 100, low: false });
  assert.equal(remaining(0, 0).low, true);
});

test("funnel segments mark done, now, ahead", () => {
  assert.deepEqual(segments(2, 4), ["done", "now", "ahead", "ahead"]);
  assert.deepEqual(segments(1, 1), ["now"]);
  assert.deepEqual(segments(5, 3), ["done", "done", "done"]);
});
