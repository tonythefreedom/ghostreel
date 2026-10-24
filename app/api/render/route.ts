// Lane B owns this route from here; Lane A scaffolded it so the approve flow (T11) has its other end.
// The rules are shared policy, kept in lib/render.ts so the person's own Claude (/mcp) follows the same ones: only an
// approved brief renders, one job per brief, every new start is spend-guarded. A live render (lib/newtype/live.ts)
// runs as the signed-in CineSynth user; the background driver (lib/newtype/runner.ts) moves it whether or not the page
// is open, and a poll only reads it (or nudges it a step).
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { guardSpend } from "@/lib/guard";
import { SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { actor, mayActOn, notYours, signInFirst } from "@/lib/owner";
import { hasLiveJob, jobFor, startRender } from "@/lib/render";
import { store } from "@/lib/store";
import { Brief } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = z.object({ briefId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const who = await actor(req);
  if (!who) return signInFirst();
  const stored = Brief.safeParse(await store.get(`brief:${body.data.briefId}`));
  if (!stored.success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const brief = stored.data;
  if (!mayActOn(who, brief)) return notYours();
  if (brief.status !== "approved") return NextResponse.json({ error: "not_approved", hint: "approve the brief first" }, { status: 409 });

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!(await hasLiveJob(brief.id))) {
    // A new render runs as the signed-in CineSynth user, and only a new start counts against the spend guard.
    if (!session) return NextResponse.json({ error: "sign_in", hint: "sign in with Google (CineSynth) to render" }, { status: 401 });
    const refused = await guardSpend(req, "render");
    if (refused) return refused;
  }
  const out = await startRender(brief, session);
  if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.error === "no_ghost" ? 404 : out.error === "sign_in" ? 401 : 409 });
  return NextResponse.json({ job: out.job }, { status: out.status });
}

export async function GET(req: NextRequest) {
  const briefId = z.string().uuid().safeParse(req.nextUrl.searchParams.get("brief"));
  return NextResponse.json({ job: briefId.success ? await jobFor(briefId.data) : null });
}
