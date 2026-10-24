// Lane B. Who is signed in (as CineSynth sees them), the public Google client id for the button, and sign-out.
import { NextResponse, type NextRequest } from "next/server";
import { revokeTokens } from "@/lib/ghostmcp/tokens";
import { OWNER_COOKIE } from "@/lib/guard";
import { currentAccount, googleClientId, ownerCookieFor, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/newtype/cinesynth";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const [account, clientId] = await Promise.all([
    currentAccount(req.cookies.get(SESSION_COOKIE)?.value),
    googleClientId().catch(() => null),
  ]);
  const res = NextResponse.json({ account, clientId });
  // An account CineSynth approved after sign-in becomes the owner without signing in again.
  const owner = account ? ownerCookieFor(account) : null;
  if (owner && req.cookies.get(OWNER_COOKIE)?.value !== owner.value) {
    res.cookies.set(owner.name, owner.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  }
  return res;
}

// Signing out drops both cookies and revokes the account's MCP connect tokens.
export async function DELETE(req: NextRequest) {
  const account = await currentAccount(req.cookies.get(SESSION_COOKIE)?.value);
  if (account) await revokeTokens(store, account.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(OWNER_COOKIE);
  return res;
}
