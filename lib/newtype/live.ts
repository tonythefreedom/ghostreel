// Lane B (10-24, Tony: a real render with progress, lip-sync included). The approved brief rendered live by
// CineSynth as the signed-in user: opening frame → voice take → lip-synced video (Wan-S2V, on the MI250 when routed
// there). When CineSynth has no GPU for lip-sync it refuses up front (nothing started, nothing charged); then the frame
// is animated over the voice here instead, and the job says it is not lip-synced.
//
// No background worker: each poll of /api/render moves the pipeline one step with the polling owner's own CineSynth
// session, and the state lives in the store, so a GhostReel restart picks up where it was. A start is never retried
// blindly: a start that failed is reported, never sent again.
import "server-only";
import { execFile } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { env } from "../env.ts";
import type { Brief, Ghost, RenderJob } from "../types.ts";
import {
  characterViews, fetchOwnFile, LipSyncUnavailable, startKeyframe, startTake, startTalking, taskStatus, TaskLost,
  type TaskState,
} from "./cinesynth.ts";
import { CINESYNTH_LANGS, estimate, motionBeats, scenePrompt, scriptOf, type Stage } from "./livePlan.ts";

export type Pipe = {
  stage: Stage | "done" | "failed";
  task?: string; // the CineSynth task of the running stage
  stageAt: string; // when the running stage started
  front: string; // the character's full-body front (keyframe reference)
  faces: string[]; // its face views (S2V identity)
  keyframe?: string; // CineSynth paths, uploads/…
  take?: string;
  takeSec?: number;
  lipSync: boolean;
  notice?: string;
};

type Patch = Partial<RenderJob>;

export class NoCharacter extends Error {}

const run = promisify(execFile);
const rendersDir = () => {
  const file = env.storeFile();
  return join(file === "off" ? join(process.cwd(), ".data") : dirname(file), "renders");
};
export const renderFile = (id: string, kind: "video" | "poster") => join(rendersDir(), `${id}.${kind === "video" ? "mp4" : "png"}`);

function publicUrl(path: string): string {
  const base = (process.env.GHOSTREEL_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}
const mediaUrl = (id: string, kind: "video" | "poster") => publicUrl(`/api/render/media?id=${id}${kind === "poster" ? "&kind=poster" : ""}`);

async function save(id: string, kind: "video" | "poster", res: Response) {
  await mkdir(rendersDir(), { recursive: true });
  await writeFile(renderFile(id, kind), Buffer.from(await res.arrayBuffer()), { mode: 0o600 });
}

/** Checks the brief can render live as this user and starts the opening frame. */
export async function startLive(brief: Brief, ghost: Ghost, token: string): Promise<{ patch: Patch; pipe: Pipe }> {
  if (!(CINESYNTH_LANGS as readonly string[]).includes(brief.lang)) throw new Error(`CineSynth has no voice for ${brief.lang}`);
  const views = await characterViews(ghost.characterId, token);
  if (!views) throw new NoCharacter(ghost.characterId);
  const task = await startKeyframe(token, scenePrompt(brief), views.front);
  const pipe: Pipe = { stage: "keyframe", task, stageAt: new Date().toISOString(), front: views.front, faces: views.faces, lipSync: true };
  return { patch: { provider: "newtype", providerJobId: task, status: "running", lipSync: true, ...view(pipe, 0) }, pipe };
}

/** The job as the page shows it: stage, share done, finish estimate. */
function view(pipe: Pipe, p: number): Patch {
  if (pipe.stage === "done" || pipe.stage === "failed") return { progress: pipe.stage === "done" ? 1 : undefined, etaAt: undefined };
  const elapsed = (Date.now() - Date.parse(pipe.stageAt)) / 1000;
  const e = estimate(pipe.stage, p, elapsed, { takeSec: pipe.takeSec, lipSync: pipe.lipSync });
  return {
    stage: pipe.stage,
    progress: Number(e.progress.toFixed(4)),
    etaAt: new Date(Date.now() + e.etaSec * 1000).toISOString(),
    clip: e.clip,
    clips: e.clips,
    lipSync: pipe.lipSync,
    notice: pipe.notice,
  };
}

const next = (pipe: Pipe, stage: Stage, task?: string): Pipe => ({ ...pipe, stage, task, stageAt: new Date().toISOString() });
const failed = (pipe: Pipe, error: string): { patch: Patch; pipe: Pipe } => ({
  pipe: { ...pipe, stage: "failed", task: undefined },
  patch: { status: "failed", error: error.slice(0, 200), progress: undefined, etaAt: undefined, notice: pipe.notice },
});

/** Moves the render one step. Returns the job fields to merge and the new pipeline state. */
export async function advance(job: RenderJob, brief: Brief, pipe: Pipe, token: string): Promise<{ patch: Patch; pipe: Pipe }> {
  if (pipe.stage === "done" || pipe.stage === "failed") return { patch: {}, pipe };
  if (pipe.stage === "assemble") return assemble(job, pipe, token);

  let st: TaskState;
  try {
    st = await taskStatus(token, pipe.task!);
  } catch (e) {
    if (!(e instanceof TaskLost)) throw e; // a network blip: keep the last state, the page polls again
    if (pipe.stage === "lipsync") return assemble(job, { ...next(pipe, "assemble"), lipSync: false, notice: "lipsync_lost" }, token);
    return failed(pipe, "CineSynth restarted and lost this step; render again");
  }
  const p = st.progress ?? 0;
  if (st.status === "failed") {
    if (pipe.stage === "lipsync") return assemble(job, { ...next(pipe, "assemble"), lipSync: false, notice: "lipsync_failed" }, token);
    return failed(pipe, st.message ?? `${pipe.stage} failed`);
  }
  if (st.status !== "completed") return { patch: { status: "running", providerJobId: pipe.task, ...view(pipe, p) }, pipe };

  if (pipe.stage === "keyframe") {
    if (!st.keyframe?.path) return failed(pipe, "CineSynth returned no frame");
    const kf = st.keyframe.path;
    await fetchOwnFile(kf, token).then((res) => save(job.id, "poster", res)).catch(() => undefined); // a missing poster never holds the render up
    let task: string;
    try {
      task = await startTake(token, scriptOf(brief), brief.lang);
    } catch (e) {
      return failed(pipe, `Voice take did not start: ${(e as Error).message}`); // reported, never sent again
    }
    const now = next({ ...pipe, keyframe: kf }, "voice", task);
    return { patch: { posterUrl: mediaUrl(job.id, "poster"), providerJobId: task, ...view(now, 0) }, pipe: now };
  }
  if (pipe.stage === "voice") {
    if (!st.audio?.path) return failed(pipe, "CineSynth returned no voice take");
    const withTake = { ...pipe, take: st.audio.path, takeSec: st.audio.duration };
    try {
      const task = await startTalking(token, {
        keyframe: withTake.keyframe!, take: withTake.take, text: scriptOf(brief), language: brief.lang,
        scenePrompt: scenePrompt(brief), beats: motionBeats(brief), faces: pipe.faces,
      });
      const now = next(withTake, "lipsync", task);
      return { patch: { providerJobId: task, ...view(now, 0) }, pipe: now };
    } catch (e) {
      // Refused up front (no GPU) is "unavailable"; anything else, a timeout included, may or may not have started an
      // hours-long GPU job, so it is never sent again: the frame is set to the voice instead.
      const notice = e instanceof LipSyncUnavailable ? "lipsync_unavailable" : "lipsync_failed";
      return assemble(job, { ...next(withTake, "assemble"), lipSync: false, notice }, token);
    }
  }
  // lip-sync finished
  if (!st.output_path) return assemble(job, { ...next(pipe, "assemble"), lipSync: false, notice: "lipsync_failed" }, token);
  await save(job.id, "video", await fetchOwnFile(st.output_path, token));
  const done: Pipe = { ...pipe, stage: "done", task: undefined };
  return { patch: { status: "done", videoUrl: mediaUrl(job.id, "video"), lipSync: true, ...view(done, 1), stage: undefined }, pipe: done };
}

/** No lip-sync: the opening frame, slowly pushed in, over the voice take. Made here with ffmpeg in seconds. */
async function assemble(job: RenderJob, pipe: Pipe, token: string): Promise<{ patch: Patch; pipe: Pipe }> {
  if (!pipe.keyframe || !pipe.take) return failed(pipe, "nothing to assemble");
  try {
    return await assembleNow(job, pipe, token);
  } catch (e) {
    return failed(pipe, `Could not set the frame to the voice: ${(e as Error).message}`);
  }
}

async function assembleNow(job: RenderJob, pipe: Pipe, token: string): Promise<{ patch: Patch; pipe: Pipe }> {
  await mkdir(rendersDir(), { recursive: true });
  const poster = renderFile(job.id, "poster");
  if (!(await stat(poster).catch(() => null))) await save(job.id, "poster", await fetchOwnFile(pipe.keyframe!, token));
  const audio = join(rendersDir(), `${job.id}.wav`);
  await writeFile(audio, Buffer.from(await (await fetchOwnFile(pipe.take!, token)).arrayBuffer()), { mode: 0o600 });
  const sec = Math.min(60, (pipe.takeSec ?? 8) + 0.6);
  const frames = Math.ceil(sec * 30);
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", "30", "-loop", "1", "-i", poster, "-i", audio,
    "-filter_complex",
    `[0:v]scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560,` +
      `zoompan=z='1+0.1*on/${frames}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=30,format=yuv420p[v]`,
    "-map", "[v]", "-map", "1:a", "-t", sec.toFixed(2), "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", renderFile(job.id, "video"),
  ], { timeout: 120_000 });
  const done: Pipe = { ...pipe, stage: "done", task: undefined };
  return {
    patch: { status: "done", videoUrl: mediaUrl(job.id, "video"), posterUrl: mediaUrl(job.id, "poster"), lipSync: false, notice: pipe.notice, progress: 1, etaAt: undefined, stage: undefined },
    pipe: done,
  };
}
