// Lane B. Sign in with Google as the CineSynth user. The ID token goes to CineSynth server-side; the CineSynth session
// it returns stays in an httpOnly cookie and never reaches the page.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSameSite } from "@/lib/guard";
import { CinesynthAuthError, ownerCookieFor, SESSION_COOKIE, SESSION_MAX_AGE, signInWithGoogle } from "@/lib/newtype/cinesynth";

const Body = z.object({ credential: z.string().min(100).max(4096) });

export async function POST(req: NextRequest) {
  const foreign = requireSameSite(req); // host match: behind Tony's tunnel the server sees itself as http://localhost
  if (foreign) return foreign;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  try {
    const { token, account } = await signInWithGoogle(parsed.data.credential);
    const res = NextResponse.json({ account });
    const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE };
    res.cookies.set(SESSION_COOKIE, token, opts);
    const owner = ownerCookieFor(account); // approved CineSynth account = owner, no passcode (Tony, 10-24)
    if (owner) res.cookies.set(owner.name, owner.value, opts);
    return res;
  } catch (e) {
    if (e instanceof CinesynthAuthError) return NextResponse.json({ error: "sign_in_failed" }, { status: e.status === 401 ? 401 : 502 });
    return NextResponse.json({ error: "sign_in_failed" }, { status: 502 });
  }
}
