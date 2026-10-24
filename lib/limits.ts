// Rate windows for a public URL, kept per process and swept so a long-running process does not grow.
// Node-safe (no Next imports) so tests run it directly.

// Best-effort client address: Cloudflare tunnel, then a proxy's real IP, then the first forwarded hop.
// A direct `next start` can be sent any header, which is why every per-IP limit also has a global one.
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

type Windows = Map<string, number[]>;
const scope = globalThis as typeof globalThis & { __ghostreelWindows?: Windows; __ghostreelWindowSweep?: ReturnType<typeof setInterval> };
const windows: Windows = (scope.__ghostreelWindows ??= new Map());
const MAX_WINDOW_MS = 15 * 60_000;
if (!scope.__ghostreelWindowSweep) {
  scope.__ghostreelWindowSweep = setInterval(() => {
    const now = Date.now();
    for (const [key, hits] of windows) if (!hits.length || now - hits[hits.length - 1]! > MAX_WINDOW_MS) windows.delete(key);
  }, 60_000);
  scope.__ghostreelWindowSweep.unref?.();
}

function hitsIn(key: string, windowMs: number): number[] {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  windows.set(key, hits);
  return hits;
}

/** Counts a hit only when it is allowed, so refused requests never grow the window. */
export function allowHit(key: string, max: number, windowMs: number): boolean {
  const hits = hitsIn(key, windowMs);
  if (hits.length >= max) return false;
  hits.push(Date.now());
  return true;
}

const UNLOCK_WINDOW_MS = MAX_WINDOW_MS;
const UNLOCK_PER_IP = 5;
const UNLOCK_GLOBAL = 30;

/** Seconds to wait before another unlock attempt from this address, or 0. */
export function unlockBlockedFor(ip: string): number {
  const mine = hitsIn(`unlock:${ip}`, UNLOCK_WINDOW_MS);
  const all = hitsIn("unlock:*", UNLOCK_WINDOW_MS);
  const full = mine.length >= UNLOCK_PER_IP ? mine : all.length >= UNLOCK_GLOBAL ? all : null;
  return full ? Math.max(1, Math.ceil((full[0]! + UNLOCK_WINDOW_MS - Date.now()) / 1000)) : 0;
}

export function recordUnlockFailure(ip: string): void {
  hitsIn(`unlock:${ip}`, UNLOCK_WINDOW_MS).push(Date.now());
  hitsIn("unlock:*", UNLOCK_WINDOW_MS).push(Date.now());
}

export function clearUnlockFailures(ip: string): void {
  windows.delete(`unlock:${ip}`);
}

/**
 * A browser POST came from our own pages. Compares hosts only: behind a TLS-terminating tunnel or proxy the server sees
 * itself as http://localhost, so a full-origin match refuses every real browser. No Origin header (curl, same-origin
 * GET-like clients) passes; a different host or an unparsable Origin does not.
 */
export function sameSite(headers: Headers, ownHost: string): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;
  let from: string;
  try {
    from = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const hosts = [headers.get("x-forwarded-host"), headers.get("host"), ownHost]
    .flatMap((h) => (h ? h.split(",").map((x) => x.trim().toLowerCase()) : []));
  return hosts.includes(from);
}

/**
 * The address people reach this server at, for links and the MCP add command: GHOSTREEL_BASE_URL when set, else the
 * tunnel's forwarded host (https unless it says otherwise), else the Host header, else the fallback.
 */
export function publicOrigin(headers: Headers, fallback: string, base = process.env.GHOSTREEL_BASE_URL): string {
  if (base) return base.replace(/\/+$/, "");
  const first = (name: string) => headers.get(name)?.split(",")[0]?.trim() || undefined;
  const fwd = first("x-forwarded-host");
  if (fwd) return `${first("x-forwarded-proto") ?? "https"}://${fwd}`;
  const host = first("host");
  return host ? `${first("x-forwarded-proto") ?? "http"}://${host}` : fallback;
}
