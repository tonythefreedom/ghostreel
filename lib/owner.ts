// Who may act (Ted, 10-24: ten judges sign in with Google; «이사한 패스코드 이런거 걸리적거리면 안되고»).
// An approved CineSynth account owns its own picks, briefs and renders, with nothing else to type. The operator's
// passcode cookie stays as the fallback, acting for no account in particular.
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { isOwner } from "./guard.ts";
import { currentAccount, SESSION_COOKIE } from "./newtype/cinesynth.ts";
import type { Brief } from "./types.ts";

export type Actor = { accountId: number | null };

/** The approved account signed in on this request, else the passcode owner (no account), else nobody. */
export async function actor(req: NextRequest): Promise<Actor | null> {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    // Signed in with Google: act as that account or not at all. A failed lookup never falls back to the operator.
    const account = await currentAccount(session);
    return account?.status === "approved" ? { accountId: account.id } : null;
  }
  return isOwner(req) ? { accountId: null } : null;
}

/** On a page: the approved account behind this session cookie, or null. */
export async function viewerAccount(session: string | undefined): Promise<number | null> {
  const account = await currentAccount(session);
  return account?.status === "approved" ? account.id : null;
}

export const signInFirst = () => NextResponse.json({ error: "locked", hint: "sign in with Google" }, { status: 401 });
export const notYours = () => NextResponse.json({ error: "not_yours" }, { status: 403 });

/** A brief belongs to the account that wrote it; the operator (no account) may act on any. */
export const mayActOn = (who: Actor, brief: Pick<Brief, "owner">) => who.accountId === null || !brief.owner || brief.owner === who.accountId;
