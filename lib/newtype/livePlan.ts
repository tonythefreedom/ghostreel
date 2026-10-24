// Lane B. What a live CineSynth render is asked for and how long it honestly takes. Pure: no I/O, so it is tested
// directly. The numbers are measured, not hoped for (PM, 10-24): Wan-S2V on the MI250 at 720×1280 runs about 45.8 s a
// diffusion step, 25 steps a clip, and a clip carries 40 frames at 16 fps (2.5 s); the talking-ad path pads the speech
// with one entry clip and two exit clips, so a 7.5 s ad is 6 clips, about 1–1.5 h.
import type { Brief } from "../types.ts";

export const SEC_PER_STEP = 45.8;
export const STEPS_PER_CLIP = 25;
export const CLIP_SEC = 40 / 16;
export const MEDIAN_SEC = { keyframe: 70, voice: 25, assemble: 20 } as const;
export const CINESYNTH_LANGS = ["en", "ko", "ja", "zh"] as const;

/** The clips S2V renders for a take of this length: one entry, the speech, two exit (CineSynth's clip plan). */
export function clipsFor(takeSec: number): number {
  return 1 + Math.max(1, Math.ceil(Math.max(0, takeSec) / CLIP_SEC)) + 2;
}

// CineSynth refuses motion beats that mention speech or travel during delivery (server _validate_motion_beats); the
// brief's "do" lines are free text, so those words are taken out here rather than failing the render.
const SPEECH = /\b(speak\w*|say\w*|said|talk\w*|utter\w*|dialogue|the line|her line)\b/gi;
const TRAVEL = /\b(walk\w*|step\w*|stride\w*|approach\w*|(?:turn|spin|pivot)\w*\s+(?:around|away|back)|sit\w*\s+down|stand\w*\s+up|(?:move|moving)\w*\s+(?:forward|toward|towards|closer|away))\b/gi;
const tidy = (s: string) => s.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").replace(/^[\s,.;]+|[\s,;]+$/g, "").trim();
const clean = (s: string, travel: boolean) => tidy((travel ? s.replace(TRAVEL, "") : s).replace(SPEECH, "")).slice(0, 280);

export function motionBeats(brief: Pick<Brief, "lines">): { entry: string; delivery: string; exit: string } {
  const does = brief.lines.map((l) => l.do.trim()).filter(Boolean);
  const entry = clean(does[0] ?? "", false) || "She looks into the camera and smiles";
  let delivery = clean(does.slice(1, -1).join("; ") || does[0] || "", true) || "She gestures naturally with her hands, staying in place";
  if (delivery.toLowerCase() === entry.toLowerCase()) delivery = "She gestures naturally with her hands, staying in place";
  const exit = clean(does.length > 1 ? (does.at(-1) ?? "") : "", false) || "She smiles and gives a small wave";
  return { entry, delivery, exit };
}

/** The opening frame's prompt, in English as CineSynth asks: where, what she wears, what she does first. */
export function scenePrompt(brief: Pick<Brief, "scene" | "outfit" | "lines">): string {
  const first = brief.lines[0]?.do.trim();
  return [brief.scene, brief.outfit && `wearing ${brief.outfit}`, first, "vertical 9:16 phone video, natural light"]
    .map((s) => (s ?? "").trim()).filter(Boolean).join(", ").slice(0, 590);
}

/** The words the ghost speaks, in order, as one take. */
export const scriptOf = (brief: Pick<Brief, "lines">) => brief.lines.map((l) => l.say.trim()).filter(Boolean).join(" ");

export type Stage = "keyframe" | "voice" | "lipsync" | "assemble";
// Share of the whole bar each stage takes, with lip-sync (hours) dwarfing the rest (a minute or two).
const WEIGHT: Record<Stage, [number, number]> = { keyframe: [0, 0.03], voice: [0.03, 0.05], lipsync: [0.05, 1], assemble: [0.05, 1] };

export type Estimate = { progress: number; etaSec: number; clip?: number; clips?: number };

/**
 * Where a render stands and how long it has left. `p` is CineSynth's own task progress (0–1) for the running stage;
 * `elapsed` is seconds since that stage started. For lip-sync CineSynth maps the remote job onto 0.05–0.85 and then
 * saves, so the rate is read from that span once it has moved; until then the measured medians stand.
 */
export function estimate(stage: Stage, p: number, elapsed: number, opts: { takeSec?: number; lipSync: boolean }): Estimate {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const [a, b] = WEIGHT[stage];
  const progress = clamp(a + (b - a) * clamp(p));
  const after = (s: Stage) => (s === "keyframe" ? MEDIAN_SEC.voice + later() : s === "voice" ? later() : 0);
  const clips = opts.takeSec ? clipsFor(opts.takeSec) : 6;
  const lipsyncSec = clips * STEPS_PER_CLIP * SEC_PER_STEP;
  const later = () => (opts.lipSync ? lipsyncSec : MEDIAN_SEC.assemble);
  if (stage === "lipsync") {
    const span = clamp((p - 0.05) / 0.8); // the remote job's own share
    const clip = Math.min(clips, Math.floor(span * clips) + 1);
    const byRate = span > 0.04 && elapsed > 60 ? (elapsed / span) * (1 - span) : null;
    const left = byRate ?? Math.max(0, lipsyncSec - elapsed);
    return { progress, etaSec: Math.round(left + 15), clip, clips };
  }
  const median = stage === "keyframe" ? MEDIAN_SEC.keyframe : stage === "voice" ? MEDIAN_SEC.voice : MEDIAN_SEC.assemble;
  return { progress, etaSec: Math.round(Math.max(5, median - elapsed) + after(stage)) };
}
