// Lane B owns this route from here; Lane A scaffolded it so the approve flow (T11) has its other end.
// The rules in it are shared policy: only an approved brief renders, one job per brief, every start is spend-guarded.
// A live render (lib/newtype/live.ts) runs as the signed-in CineSynth user; the background driver
// (lib/newtype/runner.ts) moves it whether or not the page is open, and a poll only reads it (or nudges it a step).
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { guardSpend } from "@/lib/guard";
import { getGhost } from "@/lib/newtype";
import { SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { NoCharacter, startLive } from "@/lib/newtype/live";
import { saveJob as save, startDriver, step, track } from "@/lib/newtype/runner";
import { store } from "@/lib/store";
import { RenderJob, type Brief } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = z.object({ briefId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const brief = await store.get<Brief>(`brief:${body.data.briefId}`);
  if (!brief) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (brief.status !== "approved") return NextResponse.json({ error: "not_approved", hint: "approve the brief first" }, { status: 409 });

  const existingId = await store.get<string>(`renderFor:${brief.id}`);
  const existing = existingId ? await store.get<RenderJob>(`render:${existingId}`) : null;
  if (existing && existing.status !== "failed") return NextResponse.json({ job: existing }); // one job per brief: never pay twice

  const ghost = await getGhost(brief.ghostId);
  if (!ghost) return NextResponse.json({ error: "no_ghost" }, { status: 404 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "sign_in", hint: "sign in with Google (CineSynth) to render" }, { status: 401 });

  const refused = await guardSpend(req, "render");
  if (refused) return refused;

  const id = randomUUID();
  const startedAt = new Date().toISOString();
  try {
    const { patch, pipe } = await startLive(brief, ghost, token);
    const job = await save(RenderJob.parse({ ...patch, id, briefId: brief.id, startedAt }));
    await track(id, pipe, token);
    return NextResponse.json({ job }, { status: 202 });
  } catch (e) {
    const error = e instanceof NoCharacter ? `"${ghost.characterId}" is not a character in your CineSynth yet` : (e as Error).message;
    const failed = await save({ id, briefId: brief.id, provider: "newtype", status: "failed", error: error.slice(0, 200), startedAt });
    return NextResponse.json({ job: failed }, { status: e instanceof NoCharacter ? 409 : 502 });
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const briefId = z.string().uuid().safeParse(q.get("brief"));
  const id = briefId.success ? await store.get<string>(`renderFor:${briefId.data}`) : q.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ job: null });
  const job = await store.get<RenderJob>(`render:${id}`);
  if (!job) return NextResponse.json({ job: null });
  startDriver();
  const inFlight = job.provider === "newtype" && (job.status === "queued" || job.status === "running");
  return NextResponse.json({ job: inFlight ? ((await step(id)) ?? job) : job });
}
