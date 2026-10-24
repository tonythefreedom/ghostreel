// The Shorti calls GhostReel may make: keyless reads only, so no viewer ever meets a Shorti sign-in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isKeylessRead } from "../lib/shorti/read.ts";
import { buildBriefPrompt } from "../lib/brief.ts";

test("only keyless reads leave the process; writes and sign-in tools are refused", () => {
  for (const [tool, args] of [
    ["shorti_what_to_shoot", { lens: "radar" }], ["shorti_video", { url: "x" }], ["shorti_find", { query: "x" }],
    ["shorti_format", { part: "flow" }], ["shorti_format", { part: "scene" }], ["shorti_recipe", { kind: "edit" }],
    ["shorti_recipe", { kind: "remake" }], ["shorti_arena", { view: "spots" }],
  ]) assert.equal(isKeylessRead(tool, args), true, `${tool} ${JSON.stringify(args)}`);
  for (const [tool, args] of [
    ["shorti_recipe", { kind: "brief" }], ["shorti_recipe", { kind: "cut" }], ["shorti_recipe", { kind: "my_edit" }],
    ["shorti_check", { url: "x" }], ["shorti_arena", { view: "spots", join: "x" }], ["shorti_share", {}],
    ["shorti_my_board", {}], ["shorti_deals", {}], ["shorti_recipe", { kind: "edit", idempotency_key: "k" }],
  ]) assert.equal(isKeylessRead(tool, args), false, `${tool} ${JSON.stringify(args)}`);
});

test("a hit's beat moves reach the brief prompt as fenced data", () => {
  const recipes = JSON.parse(readFileSync(new URL("../fixtures/shorti/recipes.json", import.meta.url), "utf8")).recipes;
  const moves = Object.values(recipes)[0];
  assert.ok(moves.cues.length > 0, "the recorded recipe carries cues");
  const ghost = { id: "yuna", name: "Yuna", characterId: "yuna", voiceId: "v", bio: "", niche: "", market: "US", languages: ["en"] };
  const { system, user } = buildBriefPrompt({ ghost, videoId: moves.videoId, keep: ["beat"], intent: "adapt", reading: null, plan: null, moves });
  assert.match(system, /time the beats to its cues/);
  const block = JSON.parse(user.match(/<moves>(.*?)<\/moves>/s)[1]);
  assert.equal(block.cues[0].cue, moves.cues[0].cue);
});
