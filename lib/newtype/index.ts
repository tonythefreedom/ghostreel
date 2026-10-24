// Lane B (NEWTYPE teammate owns this file). The only place that talks to CineSynth / Nexus.
// Until the live path lands, it serves the recorded roster and explicitly labelled owner-produced clips.
import "server-only";
import { z } from "zod";
import roster from "../../fixtures/newtype/characters.json" with { type: "json" };
import { Ghost, PrerenderManifest, type Brief, type RenderJob } from "../types.ts";
import { pickClip } from "./prerender.ts";

// What the adapter reports about a render; the route adds GhostReel's own id, briefId and timestamps.
// Never retry a GPU start after an ambiguous timeout: read the job's status first (review 2026-10-24, rule 5).
export type ProviderJob = Pick<RenderJob, "provider" | "providerJobId" | "status" | "videoUrl" | "posterUrl" | "manifest" | "error">;

const ghosts = z.array(Ghost).parse(roster.characters);

export async function listCharacters(): Promise<Ghost[]> {
  return ghosts; // TODO(B): live list from NEWTYPE, fixture on failure
}

export async function getGhost(id: string): Promise<Ghost | null> {
  return (await listCharacters()).find((g) => g.id === id) ?? null;
}

export async function render(brief: Brief, ghost: Ghost): Promise<ProviderJob> {
  const clip = pickClip(ghost.id, brief.lang);
  if (!clip) throw new Error(`newtype: no pre-rendered clip for ${ghost.id} yet`);
  if (clip.characterId !== ghost.characterId) throw new Error("newtype: pre-rendered character does not match ghost");
  // TODO(T2, Ted): relative URLs need an agreed lib/types.ts change.
  const base = (process.env.GHOSTREEL_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const videoUrl = `${base}/prerender/${clip.file}`;
  const posterUrl = clip.poster ? `${base}/prerender/${clip.poster}` : undefined;
  if (!z.url({ protocol: /^https?$/ }).safeParse(videoUrl).success) {
    throw new Error("newtype: GHOSTREEL_BASE_URL must be an absolute HTTP(S) URL");
  }
  return { provider: "prerender", status: "done", videoUrl, posterUrl, manifest: PrerenderManifest.parse(clip) };
}

export async function getJob(_providerJobId: string): Promise<ProviderJob> {
  throw new Error("newtype: getJob not wired yet (TASKS T6)"); // TODO(B)
}
