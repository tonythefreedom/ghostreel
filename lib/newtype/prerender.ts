// Owner-produced clips only. Read at request time so a long-running server sees newly added clips.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { Lang, PrerenderManifest } from "../types.ts";

// Basenames only: no traversal, URL schemes, query strings, or encoded separators.
const file = z.string().regex(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.[A-Za-z0-9]+$/);
export const ClipManifest = z.object({
  clips: z.array(PrerenderManifest.extend({
    ghostId: z.string().min(1),
    lang: Lang,
    file,
    poster: file.optional(),
    renderedAt: z.iso.datetime({ offset: true }),
  })),
});

export function readManifest(): z.infer<typeof ClipManifest> {
  try {
    return ClipManifest.parse(JSON.parse(readFileSync(join(process.cwd(), "public/prerender/manifest.json"), "utf8")));
  } catch {
    throw new Error("newtype: unable to read a valid pre-render manifest");
  }
}

export function pickClip(ghostId: string, lang: Lang, manifest = readManifest()) {
  return ClipManifest.parse(manifest).clips
    .filter((clip) => clip.ghostId === ghostId && clip.lang === lang)
    .sort((a, b) => Date.parse(b.renderedAt) - Date.parse(a.renderedAt))[0] ?? null;
}
