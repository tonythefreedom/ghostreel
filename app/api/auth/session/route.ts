// Lane B. Who is signed in (as CineSynth sees them), the public Google client id for the button, and sign-out.
import { NextResponse, type NextRequest } from "next/server";
import { currentAccount, googleClientId, SESSION_COOKIE } from "@/lib/newtype/cinesynth";

export async function GET(req: NextRequest) {
  const [account, clientId] = await Promise.all([
    currentAccount(req.cookies.get(SESSION_COOKIE)?.value),
    googleClientId().catch(() => null),
  ]);
  return NextResponse.json({ account, clientId });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
