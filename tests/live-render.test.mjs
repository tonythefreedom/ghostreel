import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { estimate, lipSyncSeedSec, motionBeats, scenePrompt, scriptOf, segmentsFor } from "../lib/newtype/livePlan.ts";

const brief = {
  scene: "a sunlit bathroom", outfit: "a soft pink knit",
  lines: [
    { t: 0, say: "Getting ready — twenty percent.", do: "Walks to the mirror and says hi" },
    { t: 2, say: "Serum on: sixty.", do: "Pats serum on her cheeks while talking" },
    { t: 4, say: "One swipe of tint: a hundred.", do: "Steps closer and swipes tint" },
    { t: 6, say: "Done.", do: "Smiles and waves" },
  ],
};

test("LTX renders a take in one go up to about 16.7 s padded, then in chained 8 s segments", () => {
  assert.equal(segmentsFor(7.5), 1);
  assert.equal(segmentsFor(14), 1); // 16.5 s padded
  assert.equal(segmentsFor(16.4), 3); // 18.9 s padded → 3 × 8 s
  assert.equal(lipSyncSeedSec(7.5), 12 * 60);
  assert.equal(lipSyncSeedSec(14), 20 * 60);
  assert.equal(lipSyncSeedSec(16.4), 30 * 60);
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

test("the lip-sync estimate starts from the seed, then follows the job's own rate; a count only when chained", () => {
  const start = estimate("lipsync", 0.05, 0, { takeSec: 7.5, lipSync: true });
  assert.equal(start.clips, undefined); // one render: no n/m
  assert.ok(Math.abs(start.etaSec - 12 * 60) < 60);
  // Half of the remote span done after 6 min: about 6 min left.
  const half = estimate("lipsync", 0.45, 360, { takeSec: 7.5, lipSync: true });
  assert.ok(half.etaSec > 330 && half.etaSec < 420);
  assert.ok(half.progress > start.progress && half.progress < 1);
  // Past the seed with nothing reported: still a few minutes, never "now".
  assert.ok(estimate("lipsync", 0.05, 3600, { takeSec: 7.5, lipSync: true }).etaSec >= 180);
  // A long take is chained: segment n of m.
  const long = estimate("lipsync", 0.45, 900, { takeSec: 16.4, lipSync: true });
  assert.equal(long.clips, 3);
  assert.equal(long.clip, 2);
  // Early stages count the lip-sync still to come; without lip-sync only the assembly.
  assert.ok(estimate("keyframe", 0.1, 10, { lipSync: true }).etaSec > 12 * 60);
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
