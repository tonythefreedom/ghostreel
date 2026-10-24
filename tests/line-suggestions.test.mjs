import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LineSuggestions, suggestionsFor } from "../lib/lineSuggestions.ts";

const data = LineSuggestions.parse(JSON.parse(readFileSync(new URL("../content/line-suggestions.json", import.meta.url), "utf8")));
const brief = {
  id: "b", ghostId: "yuna", sourceVideoId: "v", formatId: "fam_way-be186ab1c0a4", lang: "en", durationSec: 10, hook: "h",
  twist: "", intent: "adapt", outfit: "o", scene: "s", caption: "c", hashtags: [], status: "draft", createdAt: "x",
  lines: [{ t: 0, say: "Zero percent. Watch this.", do: "d" }, { t: 3, say: "My own line", do: "d" }],
};

test("each beat offers its current line first, then the format's other options", () => {
  const { readAt, beats } = suggestionsFor(brief, data);
  assert.ok(readAt);
  assert.equal(beats.length, 2);
  assert.equal(beats[0][0].current, true);
  assert.ok(beats[0].slice(1).every((o) => o.say !== "Zero percent. Watch this." && !o.current));
  assert.equal(beats[1][0].say, "My own line");
  assert.ok(beats[1].length > 1);
});

test("a brief whose format has no options gets none", () => {
  const { readAt, beats } = suggestionsFor({ ...brief, formatId: "fam_unknown" }, data);
  assert.equal(readAt, null);
  assert.ok(beats.every((b) => b.length === 0));
});

test("every option fits a brief line and names its Shorti basis", () => {
  for (const f of Object.values(data.formats)) for (const beat of f.beats) for (const o of beat) {
    assert.ok(o.say.length <= 200 && o.basis.length > 0);
  }
});
