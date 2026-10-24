// Spend guard for routes that cost money (Claude calls, GPU renders). The deployed URL is public, so:
// 1. the owner unlocks once with the owner passcode (httpOnly cookie); without one set, prod spends nothing;
// 2. per-IP burst limit; 3. a global daily cap (GHOSTREEL_DAILY_CAP, default 40).
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./env.ts";
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

function isOwner(req: NextRequest): boolean {
  const passcode = env.passcode();
  if (!passcode) return process.env.NODE_ENV !== "production"; // dev without a passcode: open; prod: closed
  return req.cookies.get(OWNER_COOKIE)?.value === ownerToken(passcode);
}

const bursts = new Map<string, number[]>();
function burstOk(ip: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (bursts.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  bursts.set(ip, hits);
  return hits.length <= max;
}

/** Owner-only writes that cost nothing (editing, approving): a refusal response, or null. */
export function requireOwner(req: NextRequest): NextResponse | null {
  return isOwner(req) ? null : NextResponse.json({ error: "locked", hint: "unlock with the owner passcode" }, { status: 401 });
}

/** Returns a refusal response, or null when the spend may go ahead. */
export async function guardSpend(req: NextRequest, kind: "brief" | "render"): Promise<NextResponse | null> {
  const locked = requireOwner(req);
  if (locked) return locked;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!burstOk(`${kind}:${ip}`)) {
    return NextResponse.json({ error: "slow_down" }, { status: 429, headers: { "retry-after": "60" } });
  }
  const day = new Date().toISOString().slice(0, 10);
  const used = await store.incr(`spend:${day}`, 60 * 60 * 26);
  if (used > env.dailyCap()) {
    return NextResponse.json({ error: "daily_cap", hint: "today's spend cap is used up" }, { status: 429 });
  }
  return null;
}
