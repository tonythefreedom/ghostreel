import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSnapshot, saveSnapshot } from "../lib/storeFile.ts";

const dir = () => mkdtempSync(join(tmpdir(), "gr-store-"));

test("a saved store loads back after a restart, without expired entries", () => {
  const path = join(dir(), "nested", "store.json");
  const now = Date.now();
  const m = new Map([
    ["gr:creator:c1", { value: JSON.stringify({ id: "c1" }) }],
    ["gr:mcptok:abc", { value: "{}", expiresAt: now + 60_000 }],
    ["gr:old", { value: "1", expiresAt: now - 1 }],
  ]);
  saveSnapshot(path, m, now);
  const back = loadSnapshot(path, now);
  assert.deepEqual([...back.keys()].sort(), ["gr:creator:c1", "gr:mcptok:abc"]);
  assert.equal(back.get("gr:creator:c1").value, JSON.stringify({ id: "c1" }));
});

test("entries that expire while the server is down are not loaded", () => {
  const path = join(dir(), "store.json");
  const now = Date.now();
  saveSnapshot(path, new Map([["gr:tok", { value: "x", expiresAt: now + 1000 }]]), now);
  assert.equal(loadSnapshot(path, now + 2000).size, 0);
});

test("the file is private to this user and no temp file is left behind", () => {
  const d = dir();
  const path = join(d, "store.json");
  saveSnapshot(path, new Map([["gr:a", { value: "1" }]]));
  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.deepEqual(readdirSync(d), ["store.json"]);
});

test("a missing or broken file starts empty instead of failing", () => {
  const d = dir();
  assert.equal(loadSnapshot(join(d, "none.json")).size, 0);
  const bad = join(d, "bad.json");
  writeFileSync(bad, "{not json");
  assert.equal(loadSnapshot(bad).size, 0);
});

test("the data folder stays out of the public repo", () => {
  assert.match(readFileSync(new URL("../.gitignore", import.meta.url), "utf8"), /^\.data\/$/m);
});
