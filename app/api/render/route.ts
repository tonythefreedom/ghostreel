// Lane B owns this route from here; Lane A scaffolded it so the approve flow (T11) has its other end.
// The rules in it are shared policy: only an approved brief renders, one job per brief, every start is spend-guarded.
// What Lane B fills in is lib/newtype: render() and getJob().
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { guardSpend } from "@/lib/guard";
import { getGhost, getJob, render } from "@/lib/newtype";
import { store } from "@/lib/store";
import { RenderJob, type Brief } from "@/lib/types";

export const maxDuration = 60;
const TTL = 60 * 60 * 24 * 7;

const save = async (job: RenderJob) => {
  await store.set(`render:${job.id}`, job, TTL);
  await store.set(`renderFor:${job.briefId}`, job.id, TTL);
  return job;
};

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

  const refused = await guardSpend(req, "render");
  if (refused) return refused;

  const startedAt = new Date().toISOString();
  try {
    const job = RenderJob.parse({ ...(await render(brief, ghost)), id: randomUUID(), briefId: brief.id, startedAt });
    return NextResponse.json({ job: await save(job) }, { status: 202 });
  } catch (e) {
    const failed = await save({
      id: randomUUID(),
      briefId: brief.id,
      provider: "newtype",
      status: "failed",
      error: (e as Error).message.slice(0, 200),
      startedAt,
    });
    return NextResponse.json({ job: failed }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const briefId = z.string().uuid().safeParse(q.get("brief"));
  const id = briefId.success ? await store.get<string>(`renderFor:${briefId.data}`) : q.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ job: null });
  const job = await store.get<RenderJob>(`render:${id}`);
  if (!job) return NextResponse.json({ job: null });
  const inFlight = job.status === "queued" || job.status === "running";
  if (job.provider !== "newtype" || !inFlight || !job.providerJobId) return NextResponse.json({ job });
  try {
    const now = await getJob(job.providerJobId);
    const done = now.status === "done" || now.status === "failed";
    return NextResponse.json({ job: await save(RenderJob.parse({ ...job, ...now, finishedAt: done ? new Date().toISOString() : undefined })) });
  } catch {
    return NextResponse.json({ job }); // keep the last known state; the client polls again
  }
}
