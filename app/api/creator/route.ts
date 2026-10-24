// Lane B. Registers a creator's own background and past work (T8). Owner-only and cheap (no model, no GPU):
// the analysis that spends money is T21's route, behind the spend guard.
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { CREATOR_TTL, creatorKey } from "@/lib/creator";
import { requireOwner } from "@/lib/guard";
import { getGhost } from "@/lib/newtype";
import { store } from "@/lib/store";
import { Creator, CreatorInput } from "@/lib/types";

const MAX_BYTES = 16_000;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: "cross_origin" }, { status: 403 });
  const locked = requireOwner(req);
  if (locked) return locked;

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const parsed = CreatorInput.safeParse((() => { try { return JSON.parse(raw); } catch { return null; } })());
  if (!parsed.success) return NextResponse.json({ error: "bad_body", issues: parsed.error.issues.slice(0, 3) }, { status: 400 });
  if (!(await getGhost(parsed.data.ghostId))) return NextResponse.json({ error: "no_ghost" }, { status: 404 });

  const creator = Creator.parse({ ...parsed.data, works: [...new Set(parsed.data.works)], id: randomUUID(), createdAt: new Date().toISOString() });
  await store.set(creatorKey(creator.id), creator, CREATOR_TTL);
  return NextResponse.json({ creator }, { status: 201 });
}
