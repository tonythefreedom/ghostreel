import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { handleRpc } from "../lib/ghostmcp/rpc.ts";
import { hashToken, issueToken, revokeTokens, verifyToken } from "../lib/ghostmcp/tokens.ts";

// In-memory stand-in for lib/store (get/set/push/list).
function memoryKv() {
  const m = new Map();
  return {
    m,
    async get(k) { return m.has(k) ? structuredClone(m.get(k)) : null; },
    async set(k, v) { m.set(k, structuredClone(v)); },
    async push(k, item, max) { const l = m.get(k) ?? []; m.set(k, [item, ...l].slice(0, max)); },
    async list(k) { return m.get(k) ?? []; },
  };
}

const ghost = { id: "yuna", name: "Yuna", characterId: "default", voiceId: "v", bio: "", niche: "K-beauty", market: "US", languages: ["en"] };
const me = { id: 7, email: "me@example.com" };
const other = { id: 8, email: "other@example.com" };
const draft = {
  durationSec: 10, hook: "Zero percent.", outfit: "knit", scene: "vanity", caption: "c", hashtags: ["kbeauty"], twist: "",
  lines: [{ t: 0, say: "Zero percent.", do: "bare face" }, { t: 4, say: "Done.", do: "wave" }],
};

async function setup() {
  const kv = memoryKv();
  await kv.set("creator:c1", { id: "c1", ghostId: "yuna", account: { id: me.id, email: me.email }, bio: "b", plan: "", script: "", works: [] });
  await kv.push("creators:7", "c1", 20);
  await kv.set("taste:yuna", [{ ghostId: "yuna", videoId: "v1", url: "https://example.com/v1", formatId: "f1", kept: true, keep: ["hook"], at: "x" }]);
  const deps = {
    kv,
    getGhost: async (id) => (id === "yuna" ? ghost : null),
    reading: async () => ({ videoId: "v1", hook: "h", turn: "t", whatHappens: "w", beats: [], checklist: [], needs: [], props: [] }),
    recipeEdit: async () => null,
    formatPlan: async () => ({ formatId: "f1", line: "l", open: [] }),
    creatorStyle: async () => undefined,
    allow: () => true,
    origin: "https://ghost.test",
  };
  return { kv, deps };
}
const call = (deps, auth, name, args) =>
  handleRpc(deps, auth ? `Bearer ${auth}` : null, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });

test("only the token's hash is stored, and it is compared on lookup", async () => {
  const { kv } = await setup();
  const { token, record } = await issueToken(kv, me);
  assert.match(token, /^grk_/);
  assert.equal(record.hash, hashToken(token));
  assert.ok(![...kv.m.values()].some((v) => JSON.stringify(v).includes(token)), "plain token must not be stored");
  assert.equal((await verifyToken(kv, token))?.accountId, me.id);
});

test("bad, expired and revoked tokens get 401", async () => {
  const { kv, deps } = await setup();
  assert.equal((await call(deps, "grk_nope", "ghostreel_ghosts", {})).status, 401);
  assert.equal((await call(deps, null, "ghostreel_ghosts", {})).status, 401);
  const { token } = await issueToken(kv, me);
  const later = new Date(Date.now() + 8 * 24 * 3600 * 1000);
  assert.equal((await handleRpc({ ...deps, now: later }, `Bearer ${token}`, { jsonrpc: "2.0", id: 1, method: "tools/list" })).status, 401);
  await revokeTokens(kv, me.id);
  assert.equal((await call(deps, token, "ghostreel_ghosts", {})).status, 401);
});

test("a ghost on another account is refused", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, other);
  const out = await call(deps, token, "ghostreel_brief_context", { ghostId: "yuna", videoId: "v1" });
  assert.equal(out.body.result.isError, true);
  assert.equal(out.body.result.structuredContent.error, "not_your_ghost");
});

test("context gives the prompt and schema; submit stores only a DRAFT; no approve or render tool exists", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, me);
  const list = await handleRpc(deps, `Bearer ${token}`, { jsonrpc: "2.0", id: 1, method: "tools/list" });
  const names = list.body.result.tools.map((t) => t.name);
  assert.deepEqual(names, ["ghostreel_ghosts", "ghostreel_brief_context", "ghostreel_brief_submit"]);
  assert.ok(!names.some((n) => /approve|render|post/.test(n)));
  const ctx = (await call(deps, token, "ghostreel_brief_context", { ghostId: "yuna", videoId: "v1" })).body.result.structuredContent;
  assert.ok(ctx.system && ctx.user && ctx.answerSchema.properties.lines);
  const sub = (await call(deps, token, "ghostreel_brief_submit", { ghostId: "yuna", videoId: "v1", draft })).body.result.structuredContent;
  assert.equal(sub.status, "draft");
  assert.equal((await kv.get(`brief:${sub.briefId}`)).status, "draft");
  assert.ok(sub.open.startsWith("https://ghost.test/brief/"));
  for (const out of [list, { body: { result: { structuredContent: ctx } } }, { body: { result: { structuredContent: sub } } }]) {
    assert.ok(!JSON.stringify(out.body).includes(token), "token must never appear in an answer");
  }
});

test("a draft that doesn't fit the schema is refused, not stored", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, me);
  const out = await call(deps, token, "ghostreel_brief_submit", { ghostId: "yuna", videoId: "v1", draft: { hook: "x" } });
  assert.equal(out.body.result.structuredContent.error, "bad_draft");
  assert.ok(![...kv.m.keys()].some((k) => k.startsWith("brief:")));
});

test("the route never logs or echoes the token; issue is the only response with it", () => {
  const rpc = readFileSync(new URL("../lib/ghostmcp/rpc.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/mcp-tokens/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(rpc, /console\./);
  assert.equal((route.match(/NextResponse\.json\(\{ token,/g) ?? []).length, 1);
  assert.doesNotMatch(route, /console\./);
});
