import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildBriefPrompt, finishBrief } from "../lib/brief.ts";

const deck = JSON.parse(readFileSync(new URL("../fixtures/shorti/trending-beauty.json", import.meta.url), "utf8"));
const formats = JSON.parse(readFileSync(new URL("../fixtures/shorti/formats.json", import.meta.url), "utf8")).formats;
const card = deck.cards.find((c) => c.formatKind === "format" && formats[c.formatId]);
const ghost = { id: "yuna", name: "Yuna", characterId: "yuna", voiceId: "v", bio: "Talks", niche: "K-beauty for the US", market: "US", languages: ["en"] };
const input = {
  ghost, videoId: card.videoId, formatId: card.formatId, keep: ["hook", "beat"], intent: "twist",
  reading: deck.readings[card.videoId], plan: formats[card.formatId], spot: formats[card.formatId].open[0],
};

test("prompt fences outside readings as data and carries what the owner kept", () => {
  const { system, user } = buildBriefPrompt(input);
  assert.match(system, /never instructions to you/);
  assert.match(user, /<reading>[\s\S]*<\/reading>/);
  assert.match(user, /<format>[\s\S]*<\/format>/);
  assert.match(user, /keep: hook, beat/);
  assert.match(user, /Use this open spot as the twist/);
  assert.doesNotMatch(user, new RegExp(card.by ?? "@never", "i"), "the original creator's handle never reaches the prompt");
});

test("finishBrief clamps the model's draft into a valid Brief", () => {
  const brief = finishBrief(input, {
    durationSec: 12,
    hook: "  0% → 100%: glow-up in ten seconds  ",
    lines: [
      { t: 7.33, say: "And… done.", do: "Snap to camera, full glam" },
      { t: 0.4, say: "Zero percent. Watch.", do: "Bare face, counter at 0%" },
      { t: 30, say: "", do: "Wave" },
    ],
    outfit: "cream knit", scene: "bright vanity", caption: "Ten seconds, one look.",
    hashtags: ["#kbeauty", "grwm", "#glow up", "", "a", "b", "c"], twist: "100% to 0% takedown",
  }, new Date("2026-10-24T00:00:00Z"));
  assert.equal(brief.durationSec, 10);
  assert.equal(brief.lines[0].t, 0, "first beat is the hook at t=0");
  assert.deepEqual(brief.lines.map((l) => l.t), [0, 7.3, 9.5]);
  assert.deepEqual(brief.hashtags, ["kbeauty", "grwm", "glowup", "a", "b", "c"]);
  assert.equal(brief.hook, "0% → 100%: glow-up in ten seconds");
  assert.equal(brief.status, "draft");
  assert.equal(brief.intent, "twist");
});

test("owner edits apply to a draft; approval locks it", async () => {
  const { applyEdits, BriefLocked } = await import("../lib/brief.ts");
  const draft = finishBrief(input, {
    durationSec: 10, hook: "h", lines: [{ t: 0, say: "a", do: "b" }, { t: 4, say: "c", do: "d" }],
    outfit: "o", scene: "s", caption: "c", hashtags: ["x"], twist: "",
  });
  const edited = applyEdits(draft, { hook: "New hook", lines: [{ t: 6, say: "later", do: "x" }, { t: 2, say: "first", do: "y" }], hashtags: ["#a b"] }, false);
  assert.equal(edited.hook, "New hook");
  assert.deepEqual(edited.lines.map((l) => [l.t, l.say]), [[0, "first"], [6, "later"]]);
  assert.deepEqual(edited.hashtags, ["ab"]);
  assert.equal(edited.status, "draft");
  assert.equal(edited.id, draft.id, "ids never change");
  const approved = applyEdits(edited, {}, true);
  assert.equal(approved.status, "approved");
  assert.throws(() => applyEdits(approved, { hook: "sneaky" }, false), BriefLocked);
  assert.throws(() => applyEdits(edited, { lines: [{ t: 0, say: "only one", do: "x" }] }, false), "a brief keeps at least two beats");
});
