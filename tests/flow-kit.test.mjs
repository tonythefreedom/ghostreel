import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CREATOR_FLOW, FLOW_STEP, fieldFor } from "../lib/flow.ts";

test("a creator's niche picks the matching trend deck", () => {
  assert.equal(fieldFor("K-패션 코디"), "fashion");
  assert.equal(fieldFor("OOTD styling"), "fashion");
  assert.equal(fieldFor("K-뷰티 루틴"), "beauty");
  assert.equal(fieldFor("홈카페"), "beauty");
});

const src = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("every ghost thumbnail and frame in the kit carries the full AI label", () => {
  for (const f of ["../components/kit/ReelGrid.tsx", "../components/kit/ReelLightbox.tsx"]) {
    assert.match(src(f), /AI-generated · Virtual human/, f);
  }
  assert.doesNotMatch(src("../components/kit/ReelGrid.tsx"), />AI<\/span>/);
});

test("the creator loop has four steps and every screen points inside it", () => {
  assert.deepEqual(CREATOR_FLOW.map((s) => s.title), ["등록", "고르기", "승인하기", "받기"]);
  for (const n of Object.values(FLOW_STEP)) assert.ok(n >= 1 && n <= CREATOR_FLOW.length);
});

test("onboarding asks one thing per screen with the kit's progress bar", () => {
  const form = src("../components/OnboardForm.tsx");
  assert.match(form, /<FunnelProgress /);
  assert.equal((form.match(/hidden=\{step !== \d\}/g) ?? []).length, 3);
});
