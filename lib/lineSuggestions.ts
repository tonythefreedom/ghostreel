// Lane B. Line options for each beat of a brief, picked on the storyboard. GhostReel writes the lines; each one points
// at a Shorti read (a hit's move, an opening fact, what the take may change, or an open spot), and the basis shown is
// Shorti's own words from that read. An option whose read is missing is not offered. No creator's words are reused.
// Pure and Node-safe so tests run it directly.
import { z } from "zod";
import type { Brief, OpenSpot, RecipeEdit } from "./types.ts";

const From = z.object({ kind: z.enum(["cue", "hook", "yours", "spot"]), match: z.string().min(1) });
const Option = z.object({ say: z.string().min(1).max(200), from: From });
export const LineSuggestions = z.object({
  formats: z.record(z.string(), z.object({ note: z.string(), beats: z.array(z.array(Option).max(5)).max(6) })),
});
export type LineSuggestions = z.infer<typeof LineSuggestions>;

export interface LineOption {
  say: string;
  basis: string; // Shorti's words, or "지금 대사" for the brief's own line
  share?: string; // how many of the format's hits do it, as Shorti says it
  current: boolean;
}

export interface ShortiReads {
  recipe: RecipeEdit | null;
  spots: OpenSpot[];
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function basisFor(from: z.infer<typeof From>, reads: ShortiReads): Pick<LineOption, "basis" | "share"> | null {
  const r = reads.recipe;
  if (from.kind === "cue") {
    const cue = r?.cues.find((c) => same(c.cue, from.match));
    return cue ? { basis: `Shorti move · ${cue.cue}`, share: cue.share || undefined } : null;
  }
  if (from.kind === "hook") {
    const fact = r?.hookFacts.find((f) => same(f, from.match));
    return fact ? { basis: `Shorti 오프닝 · ${fact}` } : null;
  }
  if (from.kind === "yours") {
    const item = r?.makeItYours.find((m) => same(m, from.match));
    return item ? { basis: `바꿔도 되는 것 · ${item}` } : null;
  }
  const spot = reads.spots.find((s) => same(s.label, from.match));
  return spot ? { basis: `빈자리 · ${spot.label}` } : null;
}

/** Per beat: the brief's own line first, then the options whose Shorti read is present. Empty when none are. */
export function suggestionsFor(brief: Brief, data: LineSuggestions, reads: ShortiReads): LineOption[][] {
  const format = brief.formatId ? data.formats[brief.formatId] : undefined;
  return brief.lines.map((line, i) => {
    const more = (format?.beats[i] ?? []).flatMap((o) => {
      if (same(o.say, line.say)) return [];
      const b = basisFor(o.from, reads);
      return b ? [{ say: o.say, ...b, current: false }] : [];
    });
    return more.length ? [{ say: line.say, basis: "지금 대사", current: true }, ...more] : [];
  });
}
