// The hashed denylist: private names that must never reach this public repo, held only as SHA-256.
//   node scripts/deny.mjs hash "<term>" >> tests/deny.sha256    add a term (never commit the term itself)
//   node scripts/deny.mjs check <file>                           exit 1 if the file names a private term
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const sha = (s) => createHash("sha256").update(s).digest("hex");

export const denySet = () =>
  new Set(
    readFileSync(new URL("../tests/deny.sha256", import.meta.url), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^[0-9a-f]{64}$/.test(l)),
  );

// Every token, every dotted suffix (catches hosts under a private domain), every - _ . part.
function candidates(text) {
  const out = new Set();
  for (const token of text.toLowerCase().match(/[a-z0-9][a-z0-9._-]*[a-z0-9]/g) ?? []) {
    out.add(token);
    const dots = token.split(".");
    for (let i = 1; i < dots.length - 1; i++) out.add(dots.slice(i).join("."));
    for (const part of token.split(/[._-]/)) out.add(part);
  }
  return out;
}

/** Returns the private terms found in `text`, as written there. */
export function denyHits(text, deny = denySet()) {
  return [...candidates(text)].filter((c) => deny.has(sha(c)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "hash") for (const t of rest) console.log(sha(t.trim().toLowerCase()));
  else if (cmd === "check") {
    const hits = rest.flatMap((f) => denyHits(readFileSync(f, "utf8")));
    if (hits.length) {
      console.error(`ghostreel: private name(s) in ${rest.join(", ")}: ${[...new Set(hits)].join(", ")}`);
      process.exit(1);
    }
  } else {
    console.error('usage: node scripts/deny.mjs hash "<term>" | check <file>');
    process.exit(2);
  }
}
