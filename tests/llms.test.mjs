import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
const rpc = readFileSync(new URL("../lib/ghostmcp/rpc.ts", import.meta.url), "utf8");

test("llms.txt names every MCP tool the server offers, and only those", () => {
  const offered = [...rpc.matchAll(/name: "(ghostreel_[a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(offered.sort(), [
    "ghostreel_brief_context", "ghostreel_brief_get", "ghostreel_brief_revise", "ghostreel_brief_submit",
    "ghostreel_ghosts", "ghostreel_keep", "ghostreel_render", "ghostreel_trending",
  ]);
  for (const t of offered) assert.match(llms, new RegExp(t));
  const named = new Set([...llms.matchAll(/\b(ghostreel_[a-z_]+)\b/g)].map((m) => m[1]));
  assert.deepEqual([...named].sort(), offered.sort());
});

test("llms.txt tells an AI how to connect, and keeps the person's steps marked", () => {
  assert.match(llms, /claude mcp add --transport http ghostreel https:\/\/ghost\.newtype-ai\.com\/mcp/);
  assert.match(llms, /\/connect/);
  assert.match(llms, /PERSON/);
  assert.match(llms, /DRAFT/);
});

test("llms.txt carries no real token", () => {
  assert.doesNotMatch(llms, /grk_[A-Za-z0-9_-]{40,}/);
});

test("the page head points AI assistants at llms.txt", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /"\/llms\.txt"/);
});
