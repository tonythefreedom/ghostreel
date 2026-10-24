// The public boundary, enforced. Runs in the gate, in CI, and in the pre-commit hook.
// See ARCHITECTURE.md › Heritage and the public boundary.
import { test } from "node:test";
import assert from "node:assert/strict";
import { denyHits, denySet } from "../scripts/deny.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
const files = git("ls-files", "-co", "--exclude-standard")
  .split("\n")
  .filter(Boolean)
  .filter((f) => { try { return statSync(new URL(f, root)).isFile(); } catch { return false; } });
const TEXT = /\.(ts|tsx|mjs|js|json|md|css|yml|yaml|txt|example|sha256)$|^\.(gitignore|githooks\/.*)$/;
const textFiles = files.filter((f) => TEXT.test(f) && f !== "package-lock.json");
const read = (f) => readFileSync(new URL(f, root), "utf8");
const code = textFiles.filter((f) => /\.(ts|tsx|mjs|js)$/.test(f));

test("no private name appears anywhere: files or commit messages (hashed denylist)", () => {
  const deny = denySet();
  const hits = [];
  for (const f of textFiles) {
    if (f === "tests/deny.sha256") continue;
    read(f).split("\n").forEach((line, i) => {
      for (const c of denyHits(line, deny)) hits.push(`${f}:${i + 1} "${c}"`);
    });
  }
  let messages = "";
  try { messages = git("log", "-200", "--format=%H%n%B"); } catch { /* no commits yet */ }
  let commit = "";
  for (const line of messages.split("\n")) {
    if (/^[0-9a-f]{40}$/.test(line)) { commit = line.slice(0, 7); continue; }
    for (const c of denyHits(line, deny)) hits.push(`commit ${commit} "${c}"`);
  }
  assert.deepEqual(hits, [], `private names found:\n${hits.join("\n")}`);
});

test("no secrets or credentials in tracked files", () => {
  const patterns = [
    /sk-ant-[A-Za-z0-9_-]{20,}/, /\bsk-[A-Za-z0-9]{40,}/, /AKIA[0-9A-Z]{16}/, /\bgh[pousr]_[A-Za-z0-9]{30,}/,
    /github_pat_[A-Za-z0-9_]{40,}/, /xox[abprs]-[A-Za-z0-9-]{10,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /AIza[0-9A-Za-z_-]{35}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
    /[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]{6,}@/i,
  ];
  const hits = [];
  for (const f of textFiles) for (const p of patterns) if (p.test(read(f))) hits.push(`${f} ~ ${p.source.slice(0, 24)}`);
  assert.deepEqual(hits, [], hits.join("\n"));
});

test("no private file types, no absolute local paths", () => {
  const banned = files.filter((f) => /\.(py|sql|pem|key|p12|pfx|sqlite|db|dump)$/i.test(f) || /(^|\/)\.env(?!\.example$)/.test(f));
  assert.deepEqual(banned, []);
  const local = textFiles.filter((f) => /\/Users\/[a-z]|\/home\/[a-z]+\//.test(read(f)));
  assert.deepEqual(local, [], "absolute local paths leak machine layout");
});

test("outside hosts are called only from lib/ and scripts/", () => {
  const offenders = code
    .filter((f) => !f.startsWith("lib/") && !f.startsWith("scripts/") && !f.startsWith("tests/"))
    .filter((f) => /\bfetch\(\s*(?!["'`]\/)/.test(read(f)) || /https?:\/\/(?!localhost)[a-z0-9.-]+\.[a-z]{2,}/i.test(read(f).replace(/\/\/ .*$/gm, "")));
  assert.deepEqual(offenders, [], "pages and components fetch only relative /api routes");
});

test("each provider is named only inside its own adapter", () => {
  const owners = { "shorti.ai": ["lib/shorti/", "scripts/record-shorti"], "newtype-ai.com": ["lib/newtype/"], "anthropic.com": ["lib/claude"] };
  const hits = [];
  for (const f of code) for (const [host, homes] of Object.entries(owners)) {
    if (read(f).includes(host) && !homes.some((h) => f.startsWith(h)) && !f.startsWith("tests/")) hits.push(`${f} names ${host}`);
  }
  assert.deepEqual(hits, [], hits.join("\n"));
});

test("secret env names are read only in lib/env.ts", () => {
  const secret = /\b(ANTHROPIC_API_KEY|NEWTYPE_TOKEN|UPSTASH_REDIS_REST_TOKEN|GHOSTREEL_PASSCODE)\b/;
  const hits = code.filter((f) => f !== "lib/env.ts" && !f.startsWith("tests/") && secret.test(read(f)));
  assert.deepEqual(hits, []);
});

test("fixtures hold only reduced public fields and stay small", () => {
  const allowed = new Set([
    "field", "asOf", "recordedAt", "cards", "readings", "formats",
    "videoId", "url", "platform", "by", "tag", "formatId", "formatTitle", "formatKind", "views", "viewsAsOf", "posterUrl",
    "hook", "whatHappens", "lengthS", "page", "turn", "beats", "at", "do", "checklist", "needs", "props",
    "line", "open", "label", "what", "how",
    "id", "name", "characterId", "portraitUrl", "voiceId", "bio", "niche", "market", "languages",
    "briefId", "provider", "status", "videoUrl", "startedAt", "finishedAt", "jobs", "characters",
    "recipes", "lengthMs", "bpm", "hookFacts", "cues", "cue", "share", "makeItYours", "free",
    "clipUrl", "t", "look", "cuts",
  ]);
  const fixtures = files.filter((f) => f.startsWith("fixtures/") && f.endsWith(".json"));
  for (const f of fixtures) {
    assert.ok(statSync(new URL(f, root)).size <= 64 * 1024, `${f} is over 64 KB`);
    const walk = (v, path) => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, path));
      if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) {
        const isId = path.endsWith("readings") || path.endsWith("recipes") || path.endsWith("formats") && !/^(recordedAt)$/.test(k);
        assert.ok(isId || allowed.has(k), `${f}: field "${k}" is not on the fixture allowlist`);
        walk(x, `${path}.${k}`);
      }
    };
    walk(JSON.parse(read(f)), "");
  }
});
