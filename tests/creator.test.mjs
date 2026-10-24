import { test } from "node:test";
import assert from "node:assert/strict";
import { CreatorInput } from "../lib/types.ts";

const base = { name: "Mina", niche: "K-beauty routines", languages: ["en"], ghostId: "yuna" };

test("a creator with no past shorts can register (works is optional)", () => {
  const parsed = CreatorInput.parse(base);
  assert.deepEqual(parsed.works, []);
  assert.equal(parsed.market, "US");
});

test("works stays capped at ten links and must be URLs", () => {
  const eleven = Array.from({ length: 11 }, (_, i) => `https://example.com/v/${i}`);
  assert.equal(CreatorInput.safeParse({ ...base, works: eleven }).success, false);
  assert.equal(CreatorInput.safeParse({ ...base, works: ["not a link"] }).success, false);
  assert.equal(CreatorInput.safeParse({ ...base, works: eleven.slice(0, 10) }).success, true);
});

test("the performer is a ghost id, and long texts are refused", () => {
  assert.equal(CreatorInput.safeParse({ ...base, ghostId: "Real Person" }).success, false);
  assert.equal(CreatorInput.safeParse({ ...base, plan: "x".repeat(4001) }).success, false);
});
