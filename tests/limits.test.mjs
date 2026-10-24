// Review 2026-10-24, issues 7 and 8: refused hits never grow a window; unlock attempts are limited per IP and globally.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allowHit, recordUnlockFailure, unlockBlockedFor, clearUnlockFailures, sameSite } from "../lib/limits.ts";

const req = (ip) => ip;

test("issue 7: a refused hit is not stored", () => {
  for (let i = 0; i < 3; i++) assert.equal(allowHit("g7", 3, 60_000), true);
  for (let i = 0; i < 100; i++) assert.equal(allowHit("g7", 3, 60_000), false);
  // A window that grew on refusals would still be full long after; this one holds exactly three hits.
  const realNow = Date.now;
  Date.now = () => realNow() + 61_000;
  assert.equal(allowHit("g7", 3, 60_000), true);
  Date.now = realNow;
});

test("issue 8: five wrong passcodes from one IP block that IP; success clears it", () => {
  const a = req("10.0.0.1");
  for (let i = 0; i < 5; i++) {
    assert.equal(unlockBlockedFor(a), 0);
    recordUnlockFailure(a);
  }
  assert.ok(unlockBlockedFor(a) > 0, "blocked after five failures");
  assert.equal(unlockBlockedFor(req("10.0.0.2")), 0, "another IP is not blocked yet");
  clearUnlockFailures(a);
  assert.equal(unlockBlockedFor(a), 0);
});

test("issue 8: rotating IPs still hits the global limit", () => {
  for (let i = 0; i < 40; i++) recordUnlockFailure(req(`10.1.0.${i}`));
  assert.ok(unlockBlockedFor(req("10.9.9.9")) > 0, "a fresh IP is blocked once the global window is full");
});

test("same-site check compares hosts, so a TLS tunnel's own pages pass and other sites do not", () => {
  const h = (o) => new Headers(o);
  // Behind cloudflared: the browser says https, Next sees itself as http://localhost:3000.
  assert.equal(sameSite(h({ origin: "https://ghost.newtype-ai.com", host: "ghost.newtype-ai.com" }), "localhost:3000"), true);
  assert.equal(sameSite(h({ origin: "https://ghost.newtype-ai.com", host: "localhost:3000", "x-forwarded-host": "ghost.newtype-ai.com" }), "localhost:3000"), true);
  assert.equal(sameSite(h({ origin: "http://localhost:3000" }), "localhost:3000"), true);
  assert.equal(sameSite(h({}), "localhost:3000"), true); // no Origin: not a cross-site browser form
  assert.equal(sameSite(h({ origin: "https://evil.example", host: "ghost.newtype-ai.com" }), "localhost:3000"), false);
  assert.equal(sameSite(h({ origin: "null", host: "ghost.newtype-ai.com" }), "localhost:3000"), false);
});
