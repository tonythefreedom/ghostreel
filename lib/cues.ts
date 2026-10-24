// Lane A. What the coaching pencil writes over a video (components/ui/Player.tsx `Cue`): a hit's cues as Shorti read
// them, or a ghost reel's own beats from its brief. Pure, so tests run it.
import type { Brief, PencilMark, VideoReading } from "./types.ts";

export type PencilCue = { t: number; title: string; line?: string; tags?: string[]; marks?: PencilMark[] };

/** A hit's cues, in its clock's order; none when Shorti read none. */
export function hitCues(reading: Pick<VideoReading, "cues"> | null | undefined): PencilCue[] {
  return (reading?.cues ?? [])
    .filter((c) => Number.isFinite(c.t) && c.cue)
    // A mark drawn on the frame carries its own label there; the words under the cue name only what is not drawn.
    .map((c) => {
      const marks = c.marks ?? [];
      const drawn = new Set(marks.flatMap((m) => (m.label ? [m.label] : [])));
      const tags = c.look.filter((l) => !drawn.has(l));
      return { t: c.t, title: c.cue, line: c.do || undefined, tags: tags.length ? tags : undefined, marks: marks.length ? marks : undefined };
    })
    .sort((a, b) => a.t - b.t);
}

/** A ghost reel's beats: the line it says is the title, what it does is the line under it. */
export function briefCues(brief: Pick<Brief, "lines"> | null | undefined): PencilCue[] {
  return (brief?.lines ?? [])
    .map((l) => ({ t: l.t, title: l.say || l.do, line: l.say ? l.do : undefined }))
    .filter((c) => c.title)
    .sort((a, b) => a.t - b.t);
}
