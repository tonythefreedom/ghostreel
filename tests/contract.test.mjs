// T2 as approved on 2026-10-24: GhostReel ids stay ours, provider ids are separate, a prerender carries its manifest.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RenderJob, prerenderMatches } from "../lib/types.ts";

const base = { id: "7c9e6679-7425-40de-944b-e07fc1f90ae7", briefId: "b1", status: "done", startedAt: "2026-10-24T05:00:00Z" };
const manifest = { characterId: "yuna", script: ["Zero percent.", "Done."], durationSec: 10, renderedBy: "owner session", renderedAt: "2026-10-24T04:00:00Z", source: "CineSynth talking_ad" };
const brief = { lines: [{ t: 0, say: "Zero percent.", do: "x" }, { t: 9, say: "Done.", do: "y" }] };

test("a prerendered clip without its manifest is refused", () => {
  assert.equal(RenderJob.safeParse({ ...base, provider: "prerender" }).success, false);
  assert.equal(RenderJob.safeParse({ ...base, provider: "prerender", manifest }).success, true);
  assert.equal(RenderJob.safeParse({ ...base, provider: "newtype", providerJobId: "cs_123" }).success, true);
});

test("a prerender matches a brief only when it says the same lines", () => {
  const job = RenderJob.parse({ ...base, provider: "prerender", manifest });
  assert.equal(prerenderMatches(job, brief), true);
  assert.equal(prerenderMatches(job, { lines: [...brief.lines.slice(0, 1), { t: 9, say: "All done.", do: "y" }] }), false);
});
