// Lane B. What a live CineSynth render is asked for and how long it honestly takes. Pure: no I/O, so it is tested
// directly. Since CineSynth 6a971f2 (10-24 16:47) the talking ad renders with LTX-2.5 A2V on the MI250 by default (the
// engine is CineSynth's choice). LTX pads the voice with 1 s before and 1.5 s after, and renders up to 401 frames at
// 24 fps (about 16.7 s) in one go. A longer one is cut into 8 s segments chained one after another. Its timing has only
// been seen once (a 16.4 s take still running after 10 min), so the seed below is a rough guess and the estimate
// follows CineSynth's own progress as soon as it moves.
import type { Brief } from "../types.ts";

export const PAD_SEC = 1 + 1.5;
export const SINGLE_MAX_SEC = 401 / 24;
export const SEGMENT_SEC = 8;
export const MEDIAN_SEC = { keyframe: 70, voice: 25, assemble: 20 } as const;
export const CINESYNTH_LANGS = ["en", "ko", "ja", "zh"] as const;

/** How many LTX renders a take of this length takes: one up to about 16.7 s padded, else chained 8 s segments. */
export function segmentsFor(takeSec: number): number {
  const padded = Math.max(0, takeSec) + PAD_SEC;
  return padded <= SINGLE_MAX_SEC ? 1 : Math.ceil(padded / SEGMENT_SEC);
}

/** The lip-sync time to expect before CineSynth reports any: ~12 min up to 8 s of voice, ~20 min up to one render's
 * length, and ~10 min more for each segment past two. Unknown length: the one-render guess. */
export function lipSyncSeedSec(takeSec?: number): number {
  if (takeSec == null) return 20 * 60;
  if (takeSec <= 8) return 12 * 60;
  const n = segmentsFor(takeSec);
  return n === 1 ? 20 * 60 : (20 + 10 * Math.max(0, n - 2)) * 60;
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
// Share of the whole bar each stage takes, with lip-sync (tens of minutes) dwarfing the rest (a minute or two).
const WEIGHT: Record<Stage, [number, number]> = { keyframe: [0, 0.03], voice: [0.03, 0.05], lipsync: [0.05, 1], assemble: [0.05, 1] };

export type Estimate = { progress: number; etaSec: number; clip?: number; clips?: number };

/**
 * Where a render stands and how long it has left. `p` is CineSynth's own task progress (0–1) for the running stage;
 * `elapsed` is seconds since that stage started. For lip-sync CineSynth maps the remote job onto 0.05–0.85 and then
 * saves, so the rate is read from that span once it has moved; until then the seed stands. A segment count (n of m)
 * is given only when CineSynth chains segments.
 */
export function estimate(stage: Stage, p: number, elapsed: number, opts: { takeSec?: number; lipSync: boolean }): Estimate {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const [a, b] = WEIGHT[stage];
  const progress = clamp(a + (b - a) * clamp(p));
  const after = (s: Stage) => (s === "keyframe" ? MEDIAN_SEC.voice + later() : s === "voice" ? later() : 0);
  const segments = opts.takeSec ? segmentsFor(opts.takeSec) : 1;
  const lipsyncSec = lipSyncSeedSec(opts.takeSec);
  const later = () => (opts.lipSync ? lipsyncSec : MEDIAN_SEC.assemble);
  if (stage === "lipsync") {
    const span = clamp((p - 0.05) / 0.8); // the remote job's own share
    const byRate = span > 0.04 && elapsed > 60 ? (elapsed / span) * (1 - span) : null;
    // Past the seed with nothing reported: say a few more minutes rather than "done now".
    const left = byRate ?? Math.max(180, lipsyncSec - elapsed);
    const chained = segments > 1 ? { clip: Math.min(segments, Math.floor(span * segments) + 1), clips: segments } : {};
    return { progress, etaSec: Math.round(left + 15), ...chained };
  }
  const median = stage === "keyframe" ? MEDIAN_SEC.keyframe : stage === "voice" ? MEDIAN_SEC.voice : MEDIAN_SEC.assemble;
  return { progress, etaSec: Math.round(Math.max(5, median - elapsed) + after(stage)) };
}
