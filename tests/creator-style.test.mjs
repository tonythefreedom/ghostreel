import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarize } from "../lib/creatorStyle.ts";

const recipes = JSON.parse(readFileSync(new URL("../fixtures/shorti/recipes.json", import.meta.url), "utf8")).recipes;
const urls = Object.keys(recipes);
const read = (url) => ({ url, reading: { videoId: url, hook: `hook of ${url}`, turn: "", whatHappens: "", beats: [], checklist: [], needs: [], props: [] }, recipe: recipes[url] });

test("counts only what Shorti read, and keeps Shorti's own words", () => {
  const style = summarize([read(urls[0]), { url: "https://example.com/x", reading: null, recipe: null }]);
  assert.equal(style.read, 1);
  assert.equal(style.total, 2);
  assert.deepEqual(style.hooks, [`hook of ${urls[0]}`]);
  assert.deepEqual(style.moves.map((m) => m.cue), recipes[urls[0]].cues.map((c) => c.cue).slice(0, 5));
  assert.equal(style.bpm, recipes[urls[0]].bpm);
});

test("moves shared by several of the creator's shorts come first", () => {
  const twice = summarize([read(urls[0]), read(urls[0]), read(urls[1])]);
  assert.equal(twice.moves[0].count, 2);
});

test("nothing read means an empty summary, not invented numbers", () => {
  const none = summarize([{ url: "u", reading: null, recipe: null }]);
  assert.deepEqual([none.read, none.hooks, none.moves, none.bpm, none.lengthSec], [0, [], [], null, null]);
});
