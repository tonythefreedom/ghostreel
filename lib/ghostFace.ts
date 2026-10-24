// Lane A. A ghost's face where NEWTYPE has no portrait yet: its first CineSynth keyframe from the prerender set
// (public/prerender/keyframes.json), a real frame of that ghost, never a stock picture. Pages show it cropped to the
// face; the AI label still goes on any full frame. A ghost with no keyframe yet shows its CineSynth character portrait
// (public/ghosts/, from the CineSynth landing).
import keyframes from "@/public/prerender/keyframes.json";
import type { Ghost } from "./types";

const first = new Map<string, string>();
for (const f of [...keyframes.frames].sort((a, b) => a.beat - b.beat)) {
  if (!first.has(f.ghostId)) first.set(f.ghostId, `/prerender/keyframes/${f.file}`);
}

const portraits = new Set(["yuna", "rina", "jihyun", "miyeon"]);

export function withFace<G extends Pick<Ghost, "id" | "portraitUrl">>(ghost: G): G {
  return ghost.portraitUrl ? ghost : {
    ...ghost,
    portraitUrl: first.get(ghost.id) ?? (portraits.has(ghost.id) ? `/ghosts/${ghost.id}.webp` : undefined),
  };
}
