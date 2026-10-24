// Guards for a public URL. Spend (Claude, GPU): owner cookie, per-IP burst, global daily cap (GHOSTREEL_DAILY_CAP,
// default 40). Rate windows live in lib/limits.ts. Without an owner passcode set, prod spends and writes nothing.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./env.ts";
import { allowHit, clientIp, sameSite } from "./limits.ts";
import { store } from "./store.ts";

export const OWNER_COOKIE = "gr_owner";

export function ownerToken(passcode: string): string {
  return createHmac("sha256", passcode).update("ghostreel-owner-v1").digest("hex");
}

export function passcodeMatches(given: string): boolean {
  const expected = env.passcode();
  if (!expected) return false;
  const a = Buffer.from(ownerToken(given));
  const b = Buffer.from(ownerToken(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isOwner(req: NextRequest): boolean {
  const passcode = env.passcode();
  if (!passcode) return process.env.NODE_ENV !== "production"; // dev without a passcode: open; prod: closed
  return req.cookies.get(OWNER_COOKIE)?.value === ownerToken(passcode);
}

/** Owner-only writes that cost nothing (picks, edits, approval): a refusal response, or null. */
export function requireOwner(req: NextRequest): NextResponse | null {
  return isOwner(req) ? null : NextResponse.json({ error: "locked", hint: "unlock with the owner passcode" }, { status: 401 });
}

/** Returns a refusal response, or null when the spend may go ahead. */
export async function guardSpend(req: NextRequest, kind: "brief" | "render"): Promise<NextResponse | null> {
  const locked = requireOwner(req);
  if (locked) return locked;
  if (!allowHit(`${kind}:${clientIp(req.headers)}`, 8, 60_000)) {
    return NextResponse.json({ error: "slow_down" }, { status: 429, headers: { "retry-after": "60" } });
  }
  const day = new Date().toISOString().slice(0, 10);
  const used = await store.incr(`spend:${day}`, 60 * 60 * 26);
  if (used > env.dailyCap()) {
    return NextResponse.json({ error: "daily_cap", hint: "today's spend cap is used up" }, { status: 429 });
  }
  return null;
}

/** 403 unless the request came from one of our own pages (host match; see sameSite). */
export function requireSameSite(req: NextRequest): NextResponse | null {
  return sameSite(req.headers, req.nextUrl.host) ? null : NextResponse.json({ error: "cross_origin" }, { status: 403 });
}
