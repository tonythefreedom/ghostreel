// Starting and following a ghost's render, shared by the site (/api/render) and the person's own Claude (/mcp):
// only an approved brief renders, one job per brief (never pay twice), a failed job may start again. A live render
// (Lane B's lib/newtype/live.ts) runs as the signed-in CineSynth user and is moved by the background driver
// (lib/newtype/runner.ts); reading a job in flight nudges it a step. The callers decide who may ask and guard the spend.
import "server-only";
import { randomUUID } from "node:crypto";
import { getGhost } from "./newtype/index.ts";
import { NoCharacter, startLive } from "./newtype/live.ts";
import { saveJob, startDriver, step, track } from "./newtype/runner.ts";
import { store } from "./store.ts";
import { RenderJob, type Brief } from "./types.ts";

const inFlight = (job: RenderJob) => job.provider === "newtype" && (job.status === "queued" || job.status === "running");

/** The brief's render as it stands now (a step further while it runs), or null when none was started. */
export async function jobFor(briefId: string): Promise<RenderJob | null> {
  const id = await store.get<string>(`renderFor:${briefId}`);
  const job = id ? await store.get<RenderJob>(`render:${id}`) : null;
  if (!job) return null;
  startDriver();
  return inFlight(job) ? ((await step(job.id)) ?? job) : job;
}

/** Whether a brief already has a job that is not failed (then asking again costs nothing). */
export async function hasLiveJob(briefId: string): Promise<boolean> {
  const job = await jobFor(briefId);
  return Boolean(job && job.status !== "failed");
}

export type Started = { job: RenderJob; status: number } | { error: "not_approved" | "no_ghost" | "sign_in" };

/**
 * The brief's job if it has a live one, else a new live render as the CineSynth session given (the signed-in owner's).
 * Call only after the spend guard said yes.
 */
export async function startRender(brief: Brief, session: string | undefined): Promise<Started> {
  if (brief.status !== "approved") return { error: "not_approved" };
  const existing = await jobFor(brief.id);
  if (existing && existing.status !== "failed") return { job: existing, status: 200 };
  const ghost = await getGhost(brief.ghostId);
  if (!ghost) return { error: "no_ghost" };
  if (!session) return { error: "sign_in" };
  const id = randomUUID();
  const startedAt = new Date().toISOString();
  try {
    const { patch, pipe } = await startLive(brief, ghost, session);
    const job = await saveJob(RenderJob.parse({ ...patch, id, briefId: brief.id, startedAt }));
    await track(id, pipe, session);
    return { job, status: 202 };
  } catch (e) {
    const error = e instanceof NoCharacter ? `"${ghost.characterId}" is not a character in your CineSynth yet` : (e as Error).message;
    const failed = await saveJob({ id, briefId: brief.id, provider: "newtype", status: "failed", error: error.slice(0, 200), startedAt });
    return { job: failed, status: e instanceof NoCharacter ? 409 : 502 };
  }
}
