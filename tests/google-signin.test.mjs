import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("the CineSynth session lives only in an httpOnly cookie", () => {
  const route = src("../app/api/auth/google/route.ts");
  assert.match(route, /httpOnly: true/);
  assert.doesNotMatch(route, /json\(\{[^}]*token/); // the response body carries the account, never the token
});

test("signing up needs an approved CineSynth account, not the owner passcode", () => {
  const route = src("../app/api/creator/route.ts");
  assert.match(route, /currentAccount\(/);
  assert.match(route, /account_pending/);
  assert.doesNotMatch(route, /requireOwner/);
});

test("the media proxy only fetches CineSynth result links", () => {
  const adapter = src("../lib/newtype/cinesynth.ts");
  assert.match(adapter, /target\.origin !== CINESYNTH_URL/);
  assert.match(adapter, /\\\/api\\\/mcp\\\/media\\\//);
});

test("onboarding starts with Google sign-in", () => {
  const form = src("../components/OnboardForm.tsx");
  assert.match(form, /<GoogleSignIn /);
  assert.match(form, /const STEPS = 4/);
});

test("a locked action checks the Google sign-in before asking for the passcode", () => {
  const form = src("../components/UnlockForm.tsx");
  assert.match(form, /fetch\("\/api\/auth\/session"\)/);
  assert.match(form, /status === "approved"/);
  assert.match(form, /Sign in with Google/);
  const session = src("../app/api/auth/session/route.ts");
  assert.match(session, /ownerCookieFor\(account\)/);
});
