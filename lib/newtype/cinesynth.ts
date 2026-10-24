// Lane B. Signing in with the same Google account CineSynth uses, so GhostReel acts as that CineSynth user.
// The browser gets a Google ID token for CineSynth's own (public) client id; this server trades it at CineSynth for a
// CineSynth session token and keeps that token only in an httpOnly cookie. Every later CineSynth call, the result
// downloads included, carries it as a Bearer token. Nothing here is a GhostReel secret.
import "server-only";
import { z } from "zod";
import { env } from "../env.ts";
import { OWNER_COOKIE, ownerToken } from "../guard.ts";
import { CinesynthAccount } from "../types.ts";

export const CINESYNTH_URL = (process.env.CINESYNTH_URL ?? "https://vs.newtype-ai.com").replace(/\/+$/, "");
export const SESSION_COOKIE = "gr_cs";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // CineSynth's session lasts 168 h

export class CinesynthAuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(`cinesynth auth: ${message}`);
    this.status = status;
  }
}

async function call(path: string, init: RequestInit & { token?: string } = {}): Promise<unknown> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`${CINESYNTH_URL}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = z.object({ detail: z.string() }).safeParse(body);
    throw new CinesynthAuthError(res.status, detail.success ? detail.data.detail : `HTTP ${res.status}`);
  }
  return body;
}

let clientId: string | null = null;
/** CineSynth's Google client id (public; the sign-in button needs it). */
export async function googleClientId(): Promise<string> {
  if (clientId) return clientId;
  const config = z.object({ google_client_id: z.string().min(10) }).parse(await call("/api/config"));
  clientId = config.google_client_id;
  return clientId;
}

/** Trades a Google ID token for a CineSynth session. A new email starts as "pending" until CineSynth approves it. */
export async function signInWithGoogle(credential: string): Promise<{ token: string; account: CinesynthAccount }> {
  const body = z
    .object({ token: z.string().min(20), user: CinesynthAccount })
    .parse(await call("/api/auth/google", { method: "POST", body: JSON.stringify({ credential }) }));
  return { token: body.token, account: body.user };
}

/** The signed-in CineSynth user, or null when the token is missing, expired, pending or suspended. */
export async function currentAccount(token: string | undefined): Promise<CinesynthAccount | null> {
  if (!token) return null;
  try {
    return CinesynthAccount.parse(z.object({ user: z.unknown() }).parse(await call("/api/auth/me", { token })).user);
  } catch {
    return null;
  }
}

/**
 * Tony (10-24): an approved CineSynth account is the owner, so no passcode is needed. The owner cookie Lane A's guard
 * already checks is set alongside the session; the passcode stays as a fallback. Without a passcode configured there
 * is no owner token to give, and the guard's own rule (dev open, prod closed) applies.
 */
export function ownerCookieFor(account: CinesynthAccount): { name: string; value: string } | null {
  const passcode = env.passcode();
  if (account.status !== "approved" || !passcode) return null;
  return { name: OWNER_COOKIE, value: ownerToken(passcode) };
}

/** Fetches one of the user's own CineSynth results (a link an MCP or job answer gave) with their session. */
export async function fetchMedia(url: string, token: string): Promise<Response> {
  const target = new URL(url);
  if (target.origin !== CINESYNTH_URL || !/^\/api\/mcp\/media\/[A-Za-z0-9_-]{8,64}$/.test(target.pathname)) {
    throw new CinesynthAuthError(400, "only CineSynth result links can be fetched");
  }
  const res = await fetch(target, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new CinesynthAuthError(res.status, `media HTTP ${res.status}`);
  return res;
}
