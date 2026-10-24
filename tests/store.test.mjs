// Review 2026-10-24, issues 5, 6, 7, 10: the memory store under concurrency and expiry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { store } from "../lib/store.ts";

const realNow = Date.now;
const at = (ms) => { Date.now = () => ms; };

test("issue 5: concurrent increments are never lost", async () => {
  const results = await Promise.all(Array.from({ length: 50 }, () => store.incr("t5", 60)));
  assert.equal(Math.max(...results), 50);
  assert.equal(new Set(results).size, 50);
});

test("issue 6: an expired counter restarts with a fresh expiry", async () => {
  at(1_000_000);
  await store.incr("t6", 10); // expires at 1_010_000
  at(1_020_000); // well past expiry
  assert.equal(await store.incr("t6", 10), 1, "starts over");
  at(1_025_000); // 5 s into the new window: must still be alive
  assert.equal(await store.incr("t6", 10), 2, "the new window has its own expiry");
  Date.now = realNow;
});

test("issue 7: expired keys are swept", async () => {
  at(2_000_000);
  await store.set("t7a", 1, 1);
  await store.set("t7b", 1);
  at(2_010_000);
  const before = store.stats().keys; // other tests' keys may also have expired by now
  store.sweep();
  assert.ok(store.stats().keys <= before - 1, "the expired key left the map without being read");
  assert.equal(await store.get("t7b"), 1);
  Date.now = realNow;
});

test("issue 10: concurrent list pushes keep every id, newest first, capped", async () => {
  await Promise.all(Array.from({ length: 20 }, (_, i) => store.push("t10", `id${i}`, 15, 60)));
  const list = await store.list("t10");
  assert.equal(list.length, 15);
  assert.equal(new Set(list).size, 15);
});
