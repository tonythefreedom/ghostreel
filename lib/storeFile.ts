// Keeps the memory store across restarts on the single demo host (Tony's decision, Ted's yes, 10-24): a restart used
// to drop sign-ups, kept shorts, briefs and MCP connect tokens. One JSON file, written whole to a temp file and renamed
// so a crash never leaves half a file, readable by this user only. Expired entries are not written or loaded.
// Node-safe (no Next imports) so tests run it directly.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type Entry = { value: string; expiresAt?: number };

export function loadSnapshot(path: string, now = Date.now()): Map<string, Entry> {
  const out = new Map<string, Entry>();
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return out; // no file yet: start empty
  }
  try {
    const rows = JSON.parse(raw) as Array<[string, Entry]>;
    for (const [key, entry] of rows) {
      if (typeof key !== "string" || typeof entry?.value !== "string") continue;
      if (entry.expiresAt !== undefined && entry.expiresAt <= now) continue;
      out.set(key, { value: entry.value, expiresAt: entry.expiresAt });
    }
  } catch {
    // An unreadable file never stops the server; it starts empty and the next save replaces it.
  }
  return out;
}

export function saveSnapshot(path: string, memory: Map<string, Entry>, now = Date.now()): void {
  const rows = [...memory].filter(([, e]) => e.expiresAt === undefined || e.expiresAt > now);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(rows), { mode: 0o600 });
  renameSync(tmp, path);
}
