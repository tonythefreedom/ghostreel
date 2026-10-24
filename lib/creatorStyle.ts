// Lane B (T22). A creator's style, summed up from what Shorti read about their own past shorts: each short's hook and
// turn, the moves its format's hits share, and its tempo and length. Counting only; no model, nothing invented.
// Pure and Node-safe so tests run it directly.
import type { RecipeEdit, VideoReading } from "./types.ts";

export interface WorkRead {
  url: string;
  reading: VideoReading | null;
  recipe: RecipeEdit | null;
}

export interface CreatorStyle {
  read: number; // how many of the creator's shorts Shorti could read
  total: number;
  hooks: string[]; // each read short's opening, as Shorti said it
  moves: Array<{ cue: string; do: string; count: number; share: string }>; // most shared first
  makeItYours: string[]; // what their formats leave free to change
  bpm: number | null; // median across read shorts
  lengthSec: number | null; // median
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export function summarize(works: WorkRead[]): CreatorStyle {
  const read = works.filter((w) => w.reading || w.recipe);
  const moves = new Map<string, { cue: string; do: string; count: number; share: string }>();
  for (const w of read) {
    for (const c of w.recipe?.cues ?? []) {
      const key = c.cue.trim().toLowerCase();
      const hit = moves.get(key);
      if (hit) hit.count += 1;
      else moves.set(key, { cue: c.cue, do: c.do, count: 1, share: c.share });
    }
  }
  return {
    read: read.length,
    total: works.length,
    hooks: read.map((w) => w.reading?.hook || w.recipe?.hookFacts[0] || "").filter(Boolean).slice(0, 5),
    moves: [...moves.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    makeItYours: [...new Set(read.flatMap((w) => w.recipe?.makeItYours ?? []))].slice(0, 5),
    bpm: median(read.flatMap((w) => (w.recipe?.bpm ? [w.recipe.bpm] : []))),
    lengthSec: median(read.flatMap((w) => (w.recipe?.lengthMs ? [w.recipe.lengthMs / 1000] : []))),
  };
}
