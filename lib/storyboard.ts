// Lane B (T23). The storyboard: one scene per timed beat of a brief, each with the English prompt CineSynth's
// keyframe tool takes. Scene images come from an owner-run CineSynth session and are listed in
// public/prerender/keyframes.json; until one exists for a beat, the board shows the prompt instead.
// Pure and Node-safe so tests run it directly.
import { z } from "zod";
import type { Brief, BriefLine, Ghost } from "./types.ts";

export const KeyframeManifest = z.object({
  frames: z.array(
    z.object({
      ghostId: z.string(),
      beat: z.number().int().min(0).max(5), // position in the brief's timed lines
      file: z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/),
      prompt: z.string(), // the prompt it was made from, kept for honesty
      source: z.string(), // e.g. "cinesynth cf_keyframe"
      renderedAt: z.string(),
    }),
  ),
});
export type KeyframeManifest = z.infer<typeof KeyframeManifest>;

export interface Frame {
  index: number;
  t: number;
  say: string;
  do: string;
  prompt: string;
  image: { url: string; provider: "prerender"; renderedAt: string } | null;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");

// What cinesynth_cf_keyframe gets as scene_prompt: English, one vertical shot, the beat's action first (it is what
// differs between frames), then the ghost's look and place from the brief.
export function framePrompt(brief: Brief, ghost: Ghost, line: BriefLine): string {
  const look = [brief.outfit && `wearing ${clean(brief.outfit)}`, brief.scene && `in ${clean(brief.scene)}`].filter(Boolean);
  return `${line.do ? `${clean(line.do)}. ` : ""}Vertical 9:16 shot of ${ghost.name}, a virtual human${look.length ? `, ${look.join(", ")}` : ""}.`;
}

export function buildStoryboard(brief: Brief, ghost: Ghost, manifest: KeyframeManifest): Frame[] {
  return brief.lines.map((line, index) => {
    const hit = manifest.frames
      .filter((f) => f.ghostId === ghost.id && f.beat === index)
      .sort((a, b) => b.renderedAt.localeCompare(a.renderedAt))[0];
    return {
      index,
      t: line.t,
      say: line.say,
      do: line.do,
      prompt: framePrompt(brief, ghost, line),
      image: hit ? { url: `/prerender/keyframes/${hit.file}`, provider: "prerender", renderedAt: hit.renderedAt } : null,
    };
  });
}
