// The owner's taste picks for one ghost, kept per signed-in account (ten judges at once never share a deck).
// Reading is the viewer's own; writing needs the Google sign-in or the passcode owner (review 2026-10-24, issue 1).
// Cheap (no model, no GPU), so no spend guard; size-capped instead.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tasteKey } from "@/lib/creator";
import { SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { actor, signInFirst, viewerAccount } from "@/lib/owner";
import { TastePick } from "@/lib/types";
import { store } from "@/lib/store";

const GhostId = z.string().regex(/^[a-z0-9-]{1,40}$/);
const Body = z.object({ ghostId: GhostId, picks: z.array(TastePick).max(60) });

export async function GET(req: NextRequest) {
  const ghostId = GhostId.safeParse(req.nextUrl.searchParams.get("ghost"));
  if (!ghostId.success) return NextResponse.json({ error: "bad_ghost" }, { status: 400 });
  const account = await viewerAccount(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ picks: (await store.get<TastePick[]>(tasteKey(ghostId.data, account))) ?? [] });
}

export async function PUT(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body", issues: parsed.error.issues.slice(0, 3) }, { status: 400 });
  const who = await actor(req);
  if (!who) return signInFirst();
  const { ghostId, picks } = parsed.data;
  if (picks.some((p) => p.ghostId !== ghostId)) return NextResponse.json({ error: "ghost_mismatch" }, { status: 400 });
  await store.set(tasteKey(ghostId, who.accountId), picks, 60 * 60 * 24 * 7);
  return NextResponse.json({ ok: true, kept: picks.filter((p) => p.kept).length, store: store.kind() });
}
