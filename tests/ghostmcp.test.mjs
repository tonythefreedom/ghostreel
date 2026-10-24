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
  await kv.set("taste:7:yuna", [{ ghostId: "yuna", videoId: "v1", url: "https://example.com/v1", formatId: "f1", kept: true, keep: ["hook"], at: "x" }]);
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

test("another account's kept short is not on yours", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, other);
  const out = await call(deps, token, "ghostreel_brief_context", { ghostId: "yuna", videoId: "v1" });
  assert.equal(out.body.result.isError, true);
  assert.equal(out.body.result.structuredContent.error, "not_kept");
});

test("context gives the prompt and schema; submit stores only a DRAFT; no approve or post tool exists", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, me);
  const list = await handleRpc(deps, `Bearer ${token}`, { jsonrpc: "2.0", id: 1, method: "tools/list" });
  const names = list.body.result.tools.map((t) => t.name);
  assert.deepEqual(names, [
    "ghostreel_ghosts", "ghostreel_trending", "ghostreel_keep", "ghostreel_brief_context", "ghostreel_brief_submit",
    "ghostreel_brief_get", "ghostreel_brief_revise", "ghostreel_render",
  ]);
  assert.ok(!names.some((n) => /approve|post|publish/.test(n)), "approval and posting stay the person's");
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

test("the loop: Claude reads a brief back with the owner's note and writes the next version onto the same brief", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, me);
  const sub = (await call(deps, token, "ghostreel_brief_submit", { ghostId: "yuna", videoId: "v1", draft })).body.result.structuredContent;
  const first = await kv.get(`brief:${sub.briefId}`);
  assert.equal(first.owner, me.id);
  assert.equal(first.by, "claude");
  await kv.set(`brief:${sub.briefId}`, { ...first, note: "Make the hook a question." });

  const got = (await call(deps, token, "ghostreel_brief_get", { briefId: sub.briefId })).body.result.structuredContent;
  assert.equal(got.brief.note, "Make the hook a question.");
  assert.equal(got.brief.version, 1);
  assert.ok(got.answerSchema.properties.ko, "the next version is written with its Korean");
  assert.ok(got.system && got.user, "the rules and the data come back with it");

  const ko = { hook: "0퍼센트?", lines: [{ say: "0퍼센트?", do: "민낯" }, { say: "끝.", do: "손 흔들기" }], outfit: "니트", scene: "화장대", caption: "c" };
  const rev = (await call(deps, token, "ghostreel_brief_revise", {
    briefId: sub.briefId, change: "훅을 질문으로 바꿨어요", draft: { ...draft, hook: "Zero percent?", ko },
  })).body.result.structuredContent;
  assert.equal(rev.version, 2);
  assert.equal(rev.briefId, sub.briefId, "the same brief, the same link");
  const second = await kv.get(`brief:${sub.briefId}`);
  assert.equal(second.hook, "Zero percent?");
  assert.equal(second.ko.hook, "0퍼센트?");
  assert.equal(second.lines[0].ko.say, "0퍼센트?");
  assert.equal(second.note, "", "the note is answered");
  assert.equal(second.change, "훅을 질문으로 바꿨어요");
  assert.equal(second.history[0].version, 1);
  assert.equal(second.history[0].hook, "Zero percent.");
  assert.equal(second.status, "draft");

  const listed = (await call(deps, token, "ghostreel_ghosts", {})).body.result.structuredContent;
  assert.equal(listed.ghosts[0].briefs[0].version, 2);
});

test("the loop never touches another account's brief or an approved one", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, me);
  const sub = (await call(deps, token, "ghostreel_brief_submit", { ghostId: "yuna", videoId: "v1", draft })).body.result.structuredContent;
  const { token: theirs } = await issueToken(kv, other);
  const peek = await call(deps, theirs, "ghostreel_brief_get", { briefId: sub.briefId });
  assert.equal(peek.body.result.structuredContent.error, "not_your_brief");
  const brief = await kv.get(`brief:${sub.briefId}`);
  await kv.set(`brief:${sub.briefId}`, { ...brief, status: "approved" });
  const late = await call(deps, token, "ghostreel_brief_revise", { briefId: sub.briefId, change: "x", draft });
  assert.equal(late.body.result.structuredContent.error, "approved_locked");
});

test("picks are the account's own: another account's kept short is not on yours", async () => {
  const { kv, deps } = await setup();
  const { token } = await issueToken(kv, other);
  await kv.set("creator:c2", { id: "c2", ghostId: "yuna", account: { id: other.id, email: other.email }, bio: "", plan: "", script: "", works: [] });
  await kv.push("creators:8", "c2", 20);
  const listed = (await call(deps, token, "ghostreel_ghosts", {})).body.result.structuredContent;
  assert.deepEqual(listed.ghosts[0].kept, []);
  const out = await call(deps, token, "ghostreel_brief_context", { ghostId: "yuna", videoId: "v1" });
  assert.equal(out.body.result.structuredContent.error, "not_kept");
});

test("the whole make: trending → keep → submit → render waits for the person's approval, then renders once", async () => {
  const { kv, deps } = await setup();
  const deck = [{ videoId: "v9", url: "https://example.com/v9", platform: "tiktok", formatId: "f9", hook: "h9", views: 1000 }];
  const started = [];
  const jobs = new Map();
  const make = {
    ...deps,
    listGhosts: async () => [ghost],
    trending: async (field) => (field === "beauty" ? deck : []),
    job: async (briefId) => jobs.get(briefId) ?? null,
    render: async (brief) => {
      started.push(brief.id);
      const job = { id: "00000000-0000-4000-8000-000000000001", briefId: brief.id, provider: "newtype", status: "running", startedAt: "x" };
      jobs.set(brief.id, job);
      return job;
    },
  };
  const fresh = { id: 9, email: "judge@example.com" }; // signed in and connected; no profile, nothing kept
  const { token } = await issueToken(kv, fresh);
  const listed = (await call(make, token, "ghostreel_ghosts", {})).body.result.structuredContent;
  assert.deepEqual(listed.ghosts.map((g) => g.ghostId), ["yuna"], "without a profile, the roster");
  assert.match(listed.ghosts[0].next, /ghostreel_trending/);

  const shorts = (await call(make, token, "ghostreel_trending", { field: "beauty" })).body.result.structuredContent;
  assert.equal(shorts.shorts[0].videoId, "v9");
  const nope = await call(make, token, "ghostreel_keep", { ghostId: "yuna", videoId: "not-this-week" });
  assert.equal(nope.body.result.structuredContent.error, "not_this_week");
  await call(make, token, "ghostreel_keep", { ghostId: "yuna", videoId: "v9", keep: ["hook", "beat"] });
  assert.equal((await kv.get("taste:9:yuna"))[0].videoId, "v9", "kept on the judge's own deck");

  const sub = (await call(make, token, "ghostreel_brief_submit", { ghostId: "yuna", videoId: "v9", draft })).body.result.structuredContent;
  const waiting = (await call(make, token, "ghostreel_render", { briefId: sub.briefId })).body.result.structuredContent;
  assert.equal(waiting.status, "needs_approval");
  assert.equal(started.length, 0, "nothing renders before the person approves");

  const brief = await kv.get(`brief:${sub.briefId}`);
  await kv.set(`brief:${sub.briefId}`, { ...brief, status: "approved" });
  const first = (await call(make, token, "ghostreel_render", { briefId: sub.briefId })).body.result.structuredContent;
  const again = (await call(make, token, "ghostreel_render", { briefId: sub.briefId })).body.result.structuredContent;
  assert.equal(first.status, "running");
  assert.equal(again.status, "running");
  assert.equal(started.length, 1, "one render per brief, never paid twice");

  const { token: theirs } = await issueToken(kv, other);
  const peek = await call(make, theirs, "ghostreel_render", { briefId: sub.briefId });
  assert.equal(peek.body.result.structuredContent.error, "not_your_brief");
});
