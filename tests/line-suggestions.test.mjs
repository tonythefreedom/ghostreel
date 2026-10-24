import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LineSuggestions, suggestionsFor } from "../lib/lineSuggestions.ts";

const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const data = LineSuggestions.parse(json("../content/line-suggestions.json"));
const recipe = json("../fixtures/shorti/recipes.json").recipes["https://www.instagram.com/reel/DelxnyBTeSp/"];
const spots = json("../fixtures/shorti/formats.json").formats["fam_way-be186ab1c0a4"].open;
const brief = {
  id: "b", ghostId: "yuna", sourceVideoId: "v", formatId: "fam_way-be186ab1c0a4", lang: "en", durationSec: 10, hook: "h",
  twist: "", intent: "adapt", outfit: "o", scene: "s", caption: "c", hashtags: [], status: "draft", createdAt: "x",
  lines: [{ t: 0, say: "Zero percent. Watch this.", do: "d" }, { t: 3, say: "My own line", do: "d" }],
};

test("every option's basis is Shorti's own words from the recorded read", () => {
  const beats = suggestionsFor(brief, data, { recipe, spots });
  assert.equal(beats.length, 2);
  assert.equal(beats[0][0].current, true);
  const cueTexts = recipe.cues.map((c) => c.cue);
  for (const o of beats.flat().filter((o) => !o.current)) {
    const word = o.basis.split(" · ")[1];
    assert.ok(cueTexts.includes(word) || recipe.hookFacts.includes(word) || recipe.makeItYours.includes(word)
      || spots.some((s) => s.label === word), `basis not from Shorti: ${o.basis}`);
  }
  const step = beats[1].find((o) => o.say === "Serum on: sixty.");
  assert.equal(step.share, recipe.cues.find((c) => c.cue === "Step the percent up on beats").share);
});

test("an option whose Shorti read is missing is not offered", () => {
  const beats = suggestionsFor(brief, data, { recipe: null, spots });
  assert.ok(beats.flat().every((o) => o.current || o.basis.startsWith("빈자리")));
  assert.deepEqual(suggestionsFor(brief, data, { recipe: null, spots: [] }), [[], []]);
});

test("a brief whose format has no options gets none", () => {
  assert.deepEqual(suggestionsFor({ ...brief, formatId: "fam_unknown" }, data, { recipe, spots }), [[], []]);
});
