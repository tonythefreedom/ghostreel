// Small JSON store: Upstash Redis over REST when configured, one process-wide memory map otherwise
// (a single `next start` process, or dev). Memory paths never await between a read and its write, so they are atomic.
// Without Redis the map is also kept in a file (lib/storeFile.ts) so a restart keeps sign-ups, picks, briefs and
// MCP tokens; GHOSTREEL_STORE_FILE=off turns that off.
import "server-only";
import { env } from "./env.ts";
import { loadSnapshot, saveSnapshot, type Entry } from "./storeFile.ts";

type Memory = Map<string, Entry>;
// One map per process: Next may load this module separately for pages and for route handlers.
const scope = globalThis as typeof globalThis & {
  __ghostreelStore?: Memory;
  __ghostreelSweep?: ReturnType<typeof setInterval>;
  __ghostreelSave?: ReturnType<typeof setTimeout>;
};
const file = env.storeFile() === "off" ? null : env.storeFile();
const memory: Memory = (scope.__ghostreelStore ??= file && !(env.redisUrl() && env.redisToken()) ? loadSnapshot(file) : new Map());

// Writes the map a moment after the last change, so a burst of writes is one file write.
function persist() {
  if (!file || usingRedis()) return;
  if (scope.__ghostreelSave) clearTimeout(scope.__ghostreelSave);
  scope.__ghostreelSave = setTimeout(() => {
    scope.__ghostreelSave = undefined;
    try {
      saveSnapshot(file, memory);
    } catch (e) {
      console.warn(`[store] could not save: ${(e as Error).message}`);
    }
  }, 300);
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const url = env.redisUrl();
  const token = env.redisToken();
  if (!url || !token) return undefined;
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`store: HTTP ${res.status}`);
  return ((await res.json()) as { result?: unknown }).result;
}

const usingRedis = () => Boolean(env.redisUrl() && env.redisToken());
const k = (key: string) => `gr:${key}`;
const expiry = (ttlSec?: number) => (ttlSec ? Date.now() + ttlSec * 1000 : undefined);

// The live entry, or nothing; an expired entry is dropped on the way.
function live(key: string): Entry | undefined {
  const hit = memory.get(key);
  if (hit?.expiresAt !== undefined && hit.expiresAt <= Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return hit;
}

function sweep() {
  const now = Date.now();
  let dropped = false;
  for (const [key, entry] of memory) {
    if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
      memory.delete(key);
      dropped = true;
    }
  }
  if (dropped) persist();
}
if (!scope.__ghostreelSweep) {
  scope.__ghostreelSweep = setInterval(sweep, 60_000);
  scope.__ghostreelSweep.unref?.();
}

export const store = {
  kind: () => (usingRedis() ? "redis" : "memory"),
  stats: () => ({ keys: memory.size }),
  sweep,

  async get<T>(key: string): Promise<T | null> {
    if (usingRedis()) {
      const raw = await redis(["GET", k(key)]);
      return typeof raw === "string" ? (JSON.parse(raw) as T) : null;
    }
    const hit = live(k(key));
    return hit ? (JSON.parse(hit.value) as T) : null;
  },

  async set(key: string, value: unknown, ttlSec?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (usingRedis()) {
      await redis(ttlSec ? ["SET", k(key), raw, "EX", ttlSec] : ["SET", k(key), raw]);
      return;
    }
    memory.set(k(key), { value: raw, expiresAt: expiry(ttlSec) });
    persist();
  },

  // Counter whose window starts at its first increment; used for spend caps.
  async incr(key: string, ttlSec: number): Promise<number> {
    if (usingRedis()) {
      const n = Number(await redis(["INCR", k(key)]));
      await redis(["EXPIRE", k(key), ttlSec, "NX"]); // sets the window once, even if a previous process died mid-way
      return n;
    }
    const hit = live(k(key));
    const n = (hit ? Number(hit.value) : 0) + 1;
    memory.set(k(key), { value: String(n), expiresAt: hit?.expiresAt ?? expiry(ttlSec) });
    persist();
    return n;
  },

  // Newest-first list capped at `max` items.
  async push(key: string, item: string, max: number, ttlSec: number): Promise<void> {
    if (usingRedis()) {
      await redis(["LPUSH", k(key), item]);
      await redis(["LTRIM", k(key), 0, max - 1]);
      await redis(["EXPIRE", k(key), ttlSec]);
      return;
    }
    const hit = live(k(key));
    const list = hit ? (JSON.parse(hit.value) as string[]) : [];
    memory.set(k(key), { value: JSON.stringify([item, ...list].slice(0, max)), expiresAt: expiry(ttlSec) });
    persist();
  },

  async list(key: string): Promise<string[]> {
    if (usingRedis()) {
      const raw = await redis(["LRANGE", k(key), 0, -1]);
      return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
    }
    const hit = live(k(key));
    return hit ? (JSON.parse(hit.value) as string[]) : [];
  },
};
