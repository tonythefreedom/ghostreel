// Lane B. Line options for each beat of a brief, picked on the storyboard. They are written by GhostReel from what
// Shorti read about the brief's format (its hook and open spots); Shorti itself returns no spoken lines, and no
// creator's words are reused. Pure and Node-safe so tests run it directly.
import { z } from "zod";
import type { Brief } from "./types.ts";

const Option = z.object({ say: z.string().min(1).max(200), basis: z.string().min(1).max(60) });
export const LineSuggestions = z.object({
  formats: z.record(
    z.string(),
    z.object({ readAt: z.string(), note: z.string(), beats: z.array(z.array(Option).max(5)).max(6) }),
  ),
});
export type LineSuggestions = z.infer<typeof LineSuggestions>;
export type LineOption = z.infer<typeof Option> & { current: boolean };

/** Per beat: the brief's own line first, then the format's options that differ from it. Empty when the format has none. */
export function suggestionsFor(brief: Brief, data: LineSuggestions): { readAt: string | null; beats: LineOption[][] } {
  const format = brief.formatId ? data.formats[brief.formatId] : undefined;
  return {
    readAt: format?.readAt ?? null,
    beats: brief.lines.map((line, i) => {
      const own: LineOption = { say: line.say, basis: "지금 대사", current: true };
      const more = (format?.beats[i] ?? [])
        .filter((o) => o.say.trim() !== line.say.trim())
        .map((o) => ({ ...o, current: false }));
      return more.length ? [own, ...more] : [];
    }),
  };
}
