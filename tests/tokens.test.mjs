import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("globals.css carries every DESIGN.md colour token at its DESIGN.md value", () => {
  const design = read("DESIGN.md");
  const css = read("app/globals.css");
  const tokens = [...design.matchAll(/^\| `(--[a-z0-9-]+)` \| `(#[0-9A-Fa-f]{6,8})` \|/gm)];
  assert.ok(tokens.length >= 10, `expected the colour table in DESIGN.md, found ${tokens.length} rows`);
  for (const [, name, hex] of tokens) {
    assert.match(css, new RegExp(`${name}:\\s*${hex};`, "i"), `${name} should be ${hex} in app/globals.css`);
  }
});
