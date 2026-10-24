// The owner's taste picks for one ghost. Reading is open; writing is owner-only (review 2026-10-24, issue 1).
// Cheap (no model, no GPU), so no spend guard; size-capped instead.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { TastePick } from "@/lib/types";
import { requireOwner } from "@/lib/guard";
import { store } from "@/lib/store";

const GhostId = z.string().regex(/^[a-z0-9-]{1,40}$/);
const Body = z.object({ ghostId: GhostId, picks: z.array(TastePick).max(60) });

export async function GET(req: NextRequest) {
  const ghostId = GhostId.safeParse(req.nextUrl.searchParams.get("ghost"));
  if (!ghostId.success) return NextResponse.json({ error: "bad_ghost" }, { status: 400 });
  return NextResponse.json({ picks: (await store.get<TastePick[]>(`taste:${ghostId.data}`)) ?? [] });
}

export async function PUT(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body", issues: parsed.error.issues.slice(0, 3) }, { status: 400 });
  const locked = requireOwner(req);
  if (locked) return locked;
  const { ghostId, picks } = parsed.data;
  if (picks.some((p) => p.ghostId !== ghostId)) return NextResponse.json({ error: "ghost_mismatch" }, { status: 400 });
  await store.set(`taste:${ghostId}`, picks, 60 * 60 * 24 * 7);
  return NextResponse.json({ ok: true, kept: picks.filter((p) => p.kept).length, store: store.kind() });
}
