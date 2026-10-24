// Small JSON store: Upstash Redis over REST when configured, process memory otherwise (dev, or a demo that may reset).
import "server-only";
import { env } from "./env.ts";

// One map per process: Next may load this module separately for pages and for route handlers.
type Memory = Map<string, { value: string; expiresAt?: number }>;
const scope = globalThis as typeof globalThis & { __ghostreelStore?: Memory };
const memory: Memory = (scope.__ghostreelStore ??= new Map());

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

export const store = {
  kind: () => (usingRedis() ? "redis" : "memory"),

  async get<T>(key: string): Promise<T | null> {
    if (usingRedis()) {
      const raw = await redis(["GET", k(key)]);
      return typeof raw === "string" ? (JSON.parse(raw) as T) : null;
    }
    const hit = memory.get(k(key));
    if (!hit || (hit.expiresAt && hit.expiresAt < Date.now())) return null;
    return JSON.parse(hit.value) as T;
  },

  async set(key: string, value: unknown, ttlSec?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (usingRedis()) {
      await redis(ttlSec ? ["SET", k(key), raw, "EX", ttlSec] : ["SET", k(key), raw]);
      return;
    }
    memory.set(k(key), { value: raw, expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : undefined });
  },

  // Atomic counter with an expiry set on first use; used for spend caps.
  async incr(key: string, ttlSec: number): Promise<number> {
    if (usingRedis()) {
      const n = Number(await redis(["INCR", k(key)]));
      if (n === 1) await redis(["EXPIRE", k(key), ttlSec]);
      return n;
    }
    const current = (await store.get<number>(key)) ?? 0;
    const hit = memory.get(k(key));
    memory.set(k(key), { value: String(current + 1), expiresAt: hit?.expiresAt ?? Date.now() + ttlSec * 1000 });
    return current + 1;
  },
};
