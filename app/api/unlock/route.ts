import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { isOwner, OWNER_COOKIE, ownerToken, passcodeMatches } from "@/lib/guard";
import { clearUnlockFailures, clientIp, recordUnlockFailure, unlockBlockedFor } from "@/lib/limits";
import { actor } from "@/lib/owner";

const Body = z.object({ passcode: z.string().min(1).max(200) });

// Whether this browser may already act: an approved Google sign-in, or the passcode owner's cookie.
export async function GET(req: NextRequest) {
  return NextResponse.json({ owner: isOwner(req) || (await actor(req)) !== null });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const wait = unlockBlockedFor(ip);
  if (wait > 0) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429, headers: { "retry-after": String(wait) } });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !passcodeMatches(parsed.data.passcode)) {
    recordUnlockFailure(ip);
    await new Promise((ok) => setTimeout(ok, 600)); // slow down guessing
    return NextResponse.json({ error: "wrong_passcode" }, { status: 401 });
  }
  clearUnlockFailures(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, ownerToken(env.passcode()!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 3,
  });
  return res;
}
