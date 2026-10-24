// POST writes a draft brief for one kept short (Claude: spend-guarded). PATCH lets the owner edit and approve it.
import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { applyEdits, BriefEdit, BriefLocked, type CreatorBlock } from "@/lib/brief";
import { creatorKey } from "@/lib/creator";
import { summarize } from "@/lib/creatorStyle";
import { guardSpend, requireOwner } from "@/lib/guard";
import { BriefRefused, ModelKeyMissing, modelReady, writeBrief } from "@/lib/claude";
import { getGhost } from "@/lib/newtype";
import { formatPlan, reading, recipeEdit } from "@/lib/shorti";
import { store } from "@/lib/store";
import { Intent, type Brief, type Creator, type TastePick } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  ghostId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  videoId: z.string().min(1).max(160),
  intent: Intent.default("adapt"),
  spot: z.number().int().min(0).max(5).optional(),
  creatorId: z.string().uuid().optional(), // from /onboard via /profile → /taste; the brief then sounds like them
});

// The creator's own words and the style Shorti read from their shorts (keyless, cached). Only a creator who chose this
// ghost counts; anything missing just leaves the block out.
async function creatorBlock(id: string | undefined, ghostId: string): Promise<CreatorBlock | undefined> {
  if (!id) return undefined;
  const c = await store.get<Creator>(creatorKey(id));
  if (!c || c.ghostId !== ghostId) return undefined;
  const style = c.works.length
    ? summarize(await Promise.all(c.works.map(async (url) => ({ url, reading: await reading(url, url), recipe: await recipeEdit(url) }))))
    : null;
  return {
    bio: c.bio || undefined,
    plan: c.plan || undefined,
    script: c.script || undefined,
    style: style?.read ? { hooks: style.hooks, moves: style.moves.map((m) => ({ cue: m.cue, do: m.do })), makeItYours: style.makeItYours, bpm: style.bpm, lengthSec: style.lengthSec } : undefined,
  };
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const { ghostId, videoId, intent, spot, creatorId } = parsed.data;

  const ghost = await getGhost(ghostId);
  if (!ghost) return NextResponse.json({ error: "no_ghost" }, { status: 404 });
  const picks = (await store.get<TastePick[]>(`taste:${ghostId}`)) ?? [];
  const pick = picks.find((p) => p.videoId === videoId && p.kept);
  if (!pick) return NextResponse.json({ error: "not_kept", hint: "keep the short in /taste first" }, { status: 409 });

  if (!modelReady()) return NextResponse.json({ error: "model_key_missing" }, { status: 503 }); // before the cap counts it
  const refused = await guardSpend(req, "brief"); // after cheap checks, so bad requests never count against the cap
  if (refused) return refused;

  const [read, moves, plan, creator] = await Promise.all([
    pick.url ? reading(videoId, pick.url) : Promise.resolve(null),
    pick.url ? recipeEdit(pick.url) : Promise.resolve(null),
    pick.formatId ? formatPlan(pick.formatId) : Promise.resolve(null),
    creatorBlock(creatorId, ghostId),
  ]);
  if (!read && !plan) return NextResponse.json({ error: "no_reading", hint: "Shorti had nothing on this short" }, { status: 424 });
  const openSpot = plan?.open[spot ?? 0];

  try {
    const { brief, ms, model } = await writeBrief({
      ghost,
      videoId,
      formatId: pick.formatId,
      keep: pick.keep,
      note: pick.note,
      intent: intent === "twist" && !openSpot ? "adapt" : intent,
      reading: read,
      plan,
      moves,
      spot: openSpot ? { label: openSpot.label, what: openSpot.what, how: openSpot.how } : undefined,
      creator,
    });
    await store.set(`brief:${brief.id}`, brief, 60 * 60 * 24 * 7);
    await store.push(`briefs:${ghostId}`, brief.id, 50, 60 * 60 * 24 * 7);
    return NextResponse.json({ brief, ms, model });
  } catch (e) {
    if (e instanceof ModelKeyMissing) return NextResponse.json({ error: "model_key_missing" }, { status: 503 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "brief_unusable", hint: "the draft had too few usable beats; try again" }, { status: 422 });
    if (e instanceof BriefRefused) return NextResponse.json({ error: "refused" }, { status: 422 });
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "model_busy" }, { status: 429 });
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "model_key" }, { status: 503 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ error: "model_error", status: e.status }, { status: 502 });
    console.error("[brief]", (e as Error).message);
    return NextResponse.json({ error: "brief_failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = z.string().uuid().safeParse(req.nextUrl.searchParams.get("id"));
  if (!id.success) return NextResponse.json({ error: "bad_id" }, { status: 400 });
  const brief = await store.get<Brief>(`brief:${id.data}`);
  return brief ? NextResponse.json({ brief }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}

const Patch = z.object({ id: z.string().uuid(), edits: BriefEdit.default({}), approve: z.boolean().default(false) });

export async function PATCH(req: NextRequest) {
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_body", issues: parsed.error.issues.slice(0, 3) }, { status: 400 });
  const locked = requireOwner(req);
  if (locked) return locked;
  const brief = await store.get<Brief>(`brief:${parsed.data.id}`);
  if (!brief) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const next = applyEdits(brief, parsed.data.edits, parsed.data.approve);
    await store.set(`brief:${next.id}`, next, 60 * 60 * 24 * 7);
    return NextResponse.json({ brief: next });
  } catch (e) {
    if (e instanceof BriefLocked) return NextResponse.json({ error: "approved_locked" }, { status: 409 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_edit", issues: e.issues.slice(0, 3) }, { status: 400 });
    throw e;
  }
}
