// Lane B (Tony, 10-24: the render runs in the background, and a reloaded page shows where it is). One driver in the
// `next start` process moves every live render a step about every 10 s, page open or not; the job (stage, share done,
// finish estimate) is saved each step, so any page load reads it as it stands. The driver restarts with the process
// (instrumentation.ts kicks /api/render/kick) and finds the renders still in flight in the store.
//
// To work without the page the render keeps the owner's CineSynth session in its pipeline record (the store file is
// mode 600, the record is never sent to a browser) until the render ends, then drops it.
import "server-only";
import { store } from "../store.ts";
import { RenderJob, type Brief } from "../types.ts";
import { advance, type Pipe } from "./live.ts";

export const TTL = 60 * 60 * 24 * 7;
const ACTIVE = "rendersActive";
const TICK_MS = 10_000;

export type StoredPipe = Pipe & { token?: string };
export const pipeKey = (id: string) => `renderPipe:${id}`;

export async function saveJob(job: RenderJob): Promise<RenderJob> {
  await store.set(`render:${job.id}`, job, TTL);
  await store.set(`renderFor:${job.briefId}`, job.id, TTL);
  return job;
}

/** Registers a started render with the driver. */
export async function track(id: string, pipe: Pipe, token: string): Promise<void> {
  await store.set(pipeKey(id), { ...pipe, token } satisfies StoredPipe, TTL);
  await store.push(ACTIVE, id, 50, TTL);
  startDriver();
}

const inFlight = (job: RenderJob | null) => Boolean(job && job.provider === "newtype" && (job.status === "queued" || job.status === "running"));

// One step at a time per job: the driver and a page poll must not start the same stage twice.
const busy = new Map<string, Promise<RenderJob | null>>();

/** Moves one render a step (or returns it as it is when another step is already running). */
export function step(id: string): Promise<RenderJob | null> {
  const running = busy.get(id);
  if (running) return running;
  const run = (async () => {
    const job = await store.get<RenderJob>(`render:${id}`);
    if (!job || !inFlight(job)) return job;
    const pipe = await store.get<StoredPipe>(pipeKey(id));
    const brief = await store.get<Brief>(`brief:${job.briefId}`);
    if (!pipe?.token || !brief) return job;
    try {
      const { patch, pipe: after } = await advance(job, brief, pipe, pipe.token);
      const ended = after.stage === "done" || after.stage === "failed";
      await store.set(pipeKey(id), ended ? { ...after, token: undefined } : { ...after, token: pipe.token }, TTL);
      return await saveJob(RenderJob.parse({ ...job, ...patch, finishedAt: ended ? new Date().toISOString() : undefined }));
    } catch {
      return job; // a blip (network, CineSynth busy): keep the last state and try on the next tick
    }
  })().finally(() => busy.delete(id));
  busy.set(id, run);
  return run;
}

async function tick() {
  const ids = [...new Set(await store.list(ACTIVE))];
  for (const id of ids) await step(id);
}

const g = globalThis as { __ghostreelDriver?: ReturnType<typeof setInterval> };
/** Starts the background driver once per process (safe to call from anywhere on the server). */
export function startDriver(): void {
  if (g.__ghostreelDriver) return;
  g.__ghostreelDriver = setInterval(() => void tick().catch(() => undefined), TICK_MS);
  void tick().catch(() => undefined);
}
