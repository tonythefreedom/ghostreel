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

test("a locked action asks for the Google sign-in in place; the passcode is folded away", () => {
  const form = src("../components/UnlockForm.tsx");
  assert.match(form, /fetch\("\/api\/auth\/session"\)/);
  assert.match(form, /status === "approved"/);
  assert.match(form, /<GoogleSignIn /);
  assert.match(form, /<details/); // the operator's passcode, closed by default
  const session = src("../app/api/auth/session/route.ts");
  assert.match(session, /ownerCookieFor\(account\)/);
});

test("an approved Google sign-in is the owner on every owner-only route", () => {
  const owner = src("../lib/owner.ts");
  assert.match(owner, /account\?\.status === "approved"/);
  for (const route of ["../app/api/taste/route.ts", "../app/api/brief/route.ts", "../app/api/render/route.ts"]) {
    const code = src(route);
    assert.match(code, /await actor\(req\)/, route);
    assert.doesNotMatch(code, /requireOwner/, route);
  }
});
