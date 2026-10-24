import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ClipManifest, pickClip, readManifest } from "../lib/newtype/prerender.ts";
import { render, getJob } from "../lib/newtype/index.ts";
import { RenderJob } from "../lib/types.ts";

const clip = {
  ghostId: "yuna", characterId: "yuna", lang: "en", file: "yuna-001.mp4", poster: "yuna-001.webp",
  script: ["Hello.", "Goodbye."], durationSec: 10, renderedBy: "owner session",
  source: "cinesynth talking_ad", renderedAt: "2026-10-24T01:00:00Z",
};

function withManifest(manifest, run) {
  const cwd = process.cwd();
  const dir = mkdtempSync(join(tmpdir(), "ghostreel-prerender-"));
  mkdirSync(join(dir, "public/prerender"), { recursive: true });
  writeFileSync(join(dir, "public/prerender/manifest.json"), JSON.stringify(manifest));
  process.chdir(dir);
  return Promise.resolve().then(run).finally(() => { process.chdir(cwd); rmSync(dir, { recursive: true }); });
}

test("the committed clip manifest parses", () => {
  const raw = JSON.parse(readFileSync(new URL("../public/prerender/manifest.json", import.meta.url), "utf8"));
  assert.ok(ClipManifest.safeParse(raw).success);
});

test("pickClip returns null for an empty manifest or unmatched ghost/language", () => {
  assert.equal(pickClip("yuna", "en", { clips: [] }), null);
  assert.equal(pickClip("rina", "en", { clips: [clip] }), null);
  assert.equal(pickClip("yuna", "ko", { clips: [clip] }), null);
});

test("pickClip chooses the newest matching instant without mutating the manifest", () => {
  const newer = { ...clip, file: "new.mp4", renderedAt: "2026-10-24T03:00:00+01:00" };
  const manifest = { clips: [clip, newer, { ...clip, ghostId: "rina", renderedAt: "2026-10-24T05:00:00Z" }] };
  assert.equal(pickClip("yuna", "en", manifest).file, "new.mp4");
  assert.equal(manifest.clips[0].file, "yuna-001.mp4");
});

test("manifest validates the shared provenance and rejects invalid dates or escaping filenames", () => {
  assert.equal(ClipManifest.safeParse({ clips: [clip] }).success, true);
  for (const patch of [
    { script: "not an array" }, { script: [] }, { renderedBy: "" }, { durationSec: 0 },
    { renderedAt: "not-a-date" }, { lang: "xx" }, { file: "../secret.mp4" },
    { file: "https://example.com/a.mp4" }, { file: "%2e%2e.mp4" }, { poster: "../p.png" },
  ]) assert.equal(ClipManifest.safeParse({ clips: [{ ...clip, ...patch }] }).success, false);
});

test("render returns the T2 ProviderJob with original provenance and absolute URLs", async () => {
  const before = process.env.GHOSTREEL_BASE_URL;
  process.env.GHOSTREEL_BASE_URL = "https://ghostreel.example/";
  try {
    await withManifest({ clips: [clip] }, async () => {
      const result = await render({ id: "new-brief", lang: "en" }, { id: "yuna", characterId: "yuna" });
      assert.equal(result.provider, "prerender");
      assert.equal(result.status, "done");
      assert.equal(result.videoUrl, "https://ghostreel.example/prerender/yuna-001.mp4");
      assert.equal(result.posterUrl, "https://ghostreel.example/prerender/yuna-001.webp");
      assert.deepEqual(result.manifest.script, clip.script);
      assert.equal(result.manifest.briefId, undefined); // Never relabel a clip as rendered for the new brief.
      assert.equal(result.id, undefined); // The route owns ids and timestamps.
      assert.equal(result.manifest.file, undefined);
      assert.ok(RenderJob.safeParse({ ...result, id: "job", briefId: "new-brief", startedAt: "now" }).success);
      delete process.env.GHOSTREEL_BASE_URL;
      assert.match((await render({ lang: "en" }, { id: "yuna", characterId: "yuna" })).videoUrl, /^http:\/\/localhost:3000\/prerender\//);
      process.env.GHOSTREEL_BASE_URL = "/relative";
      await assert.rejects(render({ lang: "en" }, { id: "yuna", characterId: "yuna" }), /newtype: GHOSTREEL_BASE_URL/);
    });
  } finally {
    if (before === undefined) delete process.env.GHOSTREEL_BASE_URL;
    else process.env.GHOSTREEL_BASE_URL = before;
  }
});

test("render refuses missing clips and wrong characters; getJob remains unwired", async () => {
  await withManifest({ clips: [] }, async () => {
    await assert.rejects(render({ lang: "en" }, { id: "yuna" }), /^Error: newtype: no pre-rendered clip for yuna yet$/);
  });
  await withManifest({ clips: [clip] }, async () => {
    await assert.rejects(render({ lang: "en" }, { id: "yuna", characterId: "other" }), /newtype: pre-rendered character/);
  });
  await assert.rejects(getJob("unused"), /newtype: getJob not wired yet/);
});

test("malformed manifest fails explicitly rather than silently falling back", async () => {
  await withManifest({ clips: [{ file: "bad" }] }, () => {
    assert.throws(readManifest, /newtype: unable to read a valid pre-render manifest/);
  });
});

test("ReelPlayer always contains the AI pill and conditional matching-brief disclosure", () => {
  const src = readFileSync(new URL("../components/ReelPlayer.tsx", import.meta.url), "utf8");
  // The shared Player draws the label on the picture unless told not to; a reel never tells it not to.
  assert.match(src, /<Player\b/);
  assert.doesNotMatch(src, /ai=\{false\}/);
  const player = readFileSync(new URL("../components/ui/Player.tsx", import.meta.url), "utf8");
  assert.match(player, /ai = true/);
  assert.match(player, /muted=\{muted\}/);
  assert.match(player, /useState\(true\)/); // starts muted
  assert.match(readFileSync(new URL("../components/ui/Vellum.tsx", import.meta.url), "utf8"), /AI-generated · Virtual human/);
  assert.match(src, /<DemoTag>/);
  assert.match(src, /!prerenderMatches\(job, brief\)/);
  assert.match(src, /Not rendered from this brief/);
  assert.match(src, /이 브리프로 방금 렌더한 영상이 아닙니다/);
});

test("RenderJob shows every state as steps with timing, no shimmer, without polling", () => {
  const src = readFileSync(new URL("../components/RenderJob.tsx", import.meta.url), "utf8");
  for (const state of ["queued", "running", "done", "failed"]) assert.match(src, new RegExp(state));
  assert.match(src, /<Progress steps=\{steps\}/); // ui Progress draws figures in Geist digits
  assert.doesNotMatch(src, /shimmer \{|@keyframes|animate-/);
  assert.match(src, /<ReelPlayer job=\{job\} brief=\{brief\}/);
  assert.doesNotMatch(src, /fetch\(/);
});
