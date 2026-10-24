// Lane B. Connect tokens for the GhostReel MCP server (Tony's decision, 10-24: a token now, OAuth after the hackathon).
// A signed-in, CineSynth-approved owner gets `grk_…` once; only its SHA-256 is kept, compared in constant time.
// Scope is fixed: brief context and draft submit for the owner's own ghosts. Pure over a small key-value interface,
// so tests run it without a server.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSec?: number): Promise<void>;
  push(key: string, item: string, max: number, ttlSec: number): Promise<void>;
  list(key: string): Promise<string[]>;
}

export const TOKEN_TTL_SEC = 60 * 60 * 24 * 7;
export const MAX_LIVE_TOKENS = 3;
export const SCOPE = ["brief.context", "brief.submit"] as const;

export interface TokenRecord {
  hash: string; // sha256 hex of the token; the token itself is never stored
  accountId: number;
  email: string;
  scope: typeof SCOPE;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const tokenKey = (hash: string) => `mcptok:${hash}`;
const accountKey = (accountId: number) => `mcptoks:${accountId}`;

/** A short id a person can see and revoke by; never enough to use the token. */
export const tokenId = (hash: string) => hash.slice(0, 10);

const live = (r: TokenRecord | null, now: Date): r is TokenRecord =>
  Boolean(r && !r.revokedAt && Date.parse(r.expiresAt) > now.getTime());

export async function listTokens(kv: KV, accountId: number, now = new Date()): Promise<TokenRecord[]> {
  const hashes = await kv.list(accountKey(accountId));
  const records = await Promise.all(hashes.map((h) => kv.get<TokenRecord>(tokenKey(h))));
  return records.filter((r) => live(r, now)) as TokenRecord[];
}

async function revokeRecord(kv: KV, r: TokenRecord, now: Date) {
  await kv.set(tokenKey(r.hash), { ...r, revokedAt: now.toISOString() }, TOKEN_TTL_SEC);
}

/** Issues a token for an approved account. Keeps at most three live ones: the oldest goes first. */
export async function issueToken(kv: KV, account: { id: number; email: string }, now = new Date()) {
  const token = `grk_${randomBytes(32).toString("base64url")}`;
  const record: TokenRecord = {
    hash: hashToken(token),
    accountId: account.id,
    email: account.email,
    scope: SCOPE,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_SEC * 1000).toISOString(),
  };
  const existing = (await listTokens(kv, account.id, now)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const old of existing.slice(0, Math.max(0, existing.length - (MAX_LIVE_TOKENS - 1)))) await revokeRecord(kv, old, now);
  await kv.set(tokenKey(record.hash), record, TOKEN_TTL_SEC);
  await kv.push(accountKey(account.id), record.hash, 20, TOKEN_TTL_SEC);
  return { token, record };
}

/** The record behind a presented token, or null when it is unknown, malformed, revoked or expired. */
export async function verifyToken(kv: KV, presented: string | null | undefined, now = new Date()): Promise<TokenRecord | null> {
  if (!presented || !/^grk_[A-Za-z0-9_-]{40,60}$/.test(presented)) return null;
  const hash = hashToken(presented);
  const record = await kv.get<TokenRecord>(tokenKey(hash));
  if (!record) return null;
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(record.hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return live(record, now) ? record : null;
}

/** Revokes one token by its short id, or all of an account's tokens (sign-out). Returns how many were revoked. */
export async function revokeTokens(kv: KV, accountId: number, id?: string, now = new Date()): Promise<number> {
  const records = (await listTokens(kv, accountId, now)).filter((r) => !id || tokenId(r.hash) === id);
  for (const r of records) await revokeRecord(kv, r, now);
  return records.length;
}
