import { test } from "node:test";
import assert from "node:assert/strict";
import { shortDate, viewCount } from "../lib/words.ts";

test("view counts keep at most three significant digits", () => {
  assert.equal(viewCount(1057517, "ko"), "106만");
  assert.equal(viewCount(30100000, "ko"), "3010만");
  assert.equal(viewCount(123456789, "ko"), "1.23억");
  assert.equal(viewCount(9999, "ko"), "9,999");
  assert.equal(viewCount(1057517, "en"), "1.06M");
  assert.equal(viewCount(4424849, "en"), "4.42M");
  assert.equal(viewCount(30100000, "en"), "30.1M");
  assert.equal(viewCount(373642, "en"), "374K");
  assert.equal(viewCount(950, "en"), "950");
});

test("dates read in KST", () => {
  assert.equal(shortDate("2026-10-20T23:38:13Z", "ko"), "10.21");
  assert.equal(shortDate("2026-10-21", "en"), "Oct 21");
});
