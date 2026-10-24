import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clipsFor, estimate, motionBeats, scenePrompt, scriptOf, SEC_PER_STEP, STEPS_PER_CLIP } from "../lib/newtype/livePlan.ts";

const brief = {
  scene: "a sunlit bathroom", outfit: "a soft pink knit",
  lines: [
    { t: 0, say: "Getting ready — twenty percent.", do: "Walks to the mirror and says hi" },
    { t: 2, say: "Serum on: sixty.", do: "Pats serum on her cheeks while talking" },
    { t: 4, say: "One swipe of tint: a hundred.", do: "Steps closer and swipes tint" },
    { t: 6, say: "Done.", do: "Smiles and waves" },
  ],
};

test("a 7.5 s take is the measured 6 clips: one entry, three of speech, two exit", () => {
  assert.equal(clipsFor(7.5), 6);
  assert.equal(clipsFor(0.4), 4);
});

test("motion beats never mention speech, and delivery never travels (CineSynth refuses both)", () => {
  const b = motionBeats(brief);
  for (const v of Object.values(b)) assert.doesNotMatch(v, /\b(say\w*|talk\w*|speak\w*)\b/i);
  assert.doesNotMatch(b.delivery, /\b(walk\w*|step\w*)\b/i);
  assert.notEqual(b.entry.toLowerCase(), b.delivery.toLowerCase());
  for (const v of Object.values(b)) assert.ok(v.length > 0 && v.length <= 300);
  const empty = motionBeats({ lines: [{ t: 0, say: "a", do: "" }, { t: 1, say: "b", do: "" }] });
  assert.ok(empty.entry && empty.delivery && empty.exit);
});

test("the take is every line in order, and the frame prompt names scene, outfit and first action", () => {
  assert.equal(scriptOf(brief), "Getting ready — twenty percent. Serum on: sixty. One swipe of tint: a hundred. Done.");
  const p = scenePrompt(brief);
  assert.match(p, /sunlit bathroom/);
  assert.match(p, /wearing a soft pink knit/);
  assert.ok(p.length <= 600);
});

test("the lip-sync estimate starts from the measured speed and then follows the job's own rate", () => {
  const full = 6 * STEPS_PER_CLIP * SEC_PER_STEP; // ≈ 1 h 54 min of S2V for 6 clips
  const start = estimate("lipsync", 0.05, 0, { takeSec: 7.5, lipSync: true });
  assert.equal(start.clip, 1);
  assert.equal(start.clips, 6);
  assert.ok(Math.abs(start.etaSec - full) < 60);
  // Half of the remote span done after 40 min: about 40 min left, clip 4 of 6.
  const half = estimate("lipsync", 0.45, 2400, { takeSec: 7.5, lipSync: true });
  assert.equal(half.clip, 4);
  assert.ok(half.etaSec > 2300 && half.etaSec < 2500);
  assert.ok(half.progress > start.progress && half.progress < 1);
  // Early stages count the hours of lip-sync still to come.
  assert.ok(estimate("keyframe", 0.1, 10, { lipSync: true }).etaSec > full);
  assert.ok(estimate("assemble", 0, 0, { lipSync: false }).etaSec < 60);
});

const src = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("a live render keeps going without the page and never starts a stage twice", () => {
  const runner = src("../lib/newtype/runner.ts");
  assert.match(runner, /setInterval/);
  assert.match(runner, /busy\.get\(id\)/);
  assert.match(runner, /token: undefined/); // the session is dropped when the render ends
  assert.match(src("../lib/renderKick.ts"), /\/api\/render\/kick/);
  assert.match(src("../instrumentation.ts"), /kickRenderDriver/);
  // The render state is read from the store on page load, so a reload shows the bar where it stands.
  assert.match(src("../app/brief/[id]/page.tsx"), /store\.get<RenderJob>/);
  assert.match(src("../components/brief/RenderState.tsx"), /role="progressbar"/);
});

test("review 10-24: one render per brief even on a double tap, and no GPU start is ever sent twice", () => {
  assert.match(src("../lib/render.ts"), /starting\.get\(brief\.id\)/); // concurrent starts share the first
  assert.match(src("../components/BriefEditor.tsx"), /disabled=\{busy\} onClick=\{\(\) => void startRender\(\)\}/);
  const live = src("../lib/newtype/live.ts");
  assert.doesNotMatch(live, /if \(!\(e instanceof LipSyncUnavailable\)\) throw e/); // a lip-sync start that failed is never re-sent
  assert.match(live, /Voice take did not start/);
  assert.match(src("../lib/newtype/runner.ts"), /GIVE_UP_MS/); // never "running" forever
});

test("review 10-24: a Google sign-in never acts as the operator", () => {
  assert.match(src("../lib/newtype/cinesynth.ts"), /ownerCookieFor\(_account: CinesynthAccount\)[^\n]*\n\s*return null;/);
  assert.match(src("../lib/guard.ts"), /ghostreel-owner-v2/); // cookies handed out before are void
  assert.match(src("../lib/owner.ts"), /if \(session\) \{[\s\S]*?return account\?\.status === "approved" \? \{ accountId: account\.id \} : null;/);
});

test("review 10-24: switching field or language keeps the picks from the other decks", () => {
  const swipe = src("../components/TasteSwipe.tsx");
  assert.match(swipe, /picks: \[\.\.\.others\.current, \.\.\.next\]/);
  assert.match(src("../app/api/taste/route.ts"), /max\(200\)/);
});
