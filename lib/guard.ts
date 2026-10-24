// Guards for a public URL. Spend (Claude, GPU): who acts (lib/owner.ts), per-IP burst, global daily cap
// (GHOSTREEL_DAILY_CAP, default 40). Rate windows live in lib/limits.ts. Prod with neither a signed-in approved account
// nor the passcode owner spends and writes nothing.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./env.ts";
import { allowHit, clientIp, sameSite } from "./limits.ts";
import { store } from "./store.ts";

export const OWNER_COOKIE = "gr_owner";

// v2 (10-24): every approved Google sign-in used to get this cookie too, so one judge could act as the operator on
// another's briefs. Only the passcode gives it now, and the version change voids the ones already handed out.
export function ownerToken(passcode: string): string {
  return createHmac("sha256", passcode).update("ghostreel-owner-v2").digest("hex");
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

/** Returns a refusal response, or null when the spend may go ahead. Call it after lib/owner.ts `actor` said who acts. */
export async function guardSpend(req: NextRequest, kind: "brief" | "render"): Promise<NextResponse | null> {
  if (!allowHit(`${kind}:${clientIp(req.headers)}`, 8, 60_000)) {
    return NextResponse.json({ error: "slow_down" }, { status: 429, headers: { "retry-after": "60" } });
  }
  if (!(await underDailyCap())) {
    return NextResponse.json({ error: "daily_cap", hint: "today's spend cap is used up" }, { status: 429 });
  }
  return null;
}

/** Counts one spend against today's cap (shared by the site and the MCP server); false once the cap is used up. */
export async function underDailyCap(): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  return (await store.incr(`spend:${day}`, 60 * 60 * 26)) <= env.dailyCap();
}

/** 403 unless the request came from one of our own pages (host match; see sameSite). */
export function requireSameSite(req: NextRequest): NextResponse | null {
  return sameSite(req.headers, req.nextUrl.host) ? null : NextResponse.json({ error: "cross_origin" }, { status: 403 });
}
