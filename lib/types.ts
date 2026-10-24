// The contracts. Shared by both lanes; change only by agreement (RULES.md).
// Schemas validate at the edges (adapter answers, request bodies); types are inferred from them.
import { z } from "zod";

export const Lang = z.enum(["en", "ko", "ja", "es"]);
export const Platform = z.enum(["tiktok", "instagram", "youtube"]);
export type Lang = z.infer<typeof Lang>;
export type Platform = z.infer<typeof Platform>;

// ── Ghost ────────────────────────────────────────────────────────────────────
export const Ghost = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  characterId: z.string().min(1), // NEWTYPE character id
  portraitUrl: z.string().url().optional(), // NEWTYPE supplies; a gradient monogram stands in until then
  voiceId: z.string().min(1), // synthetic, or the owner's own voice with a NEWTYPE consent record
  bio: z.string().default(""),
  niche: z.string().default(""), // "K-beauty for the US"
  market: z.string().default("US"),
  languages: z.array(Lang).min(1).default(["en"]),
});
export type Ghost = z.infer<typeof Ghost>;

// ── What Shorti read (public MCP answers, reduced to what GhostReel uses) ────
export const Provenance = z.object({
  source: z.enum(["live", "fixture"]),
  readAt: z.string(), // when Shorti (or the fixture recording) read it
});
export type Provenance = z.infer<typeof Provenance>;

export const TrendCard = z.object({
  videoId: z.string(),
  url: z.string().url(),
  platform: z.string(),
  by: z.string().optional(),
  tag: z.string().optional(), // "New format", "Sound breaking out", …
  formatId: z.string().optional(),
  formatTitle: z.string().optional(),
  formatKind: z.string().optional(), // "format" | "sound" | …
  views: z.number().int().nonnegative().optional(), // the platform's count, as read
  viewsAsOf: z.string().optional(),
  posterUrl: z.string().url().optional(),
  hook: z.string().optional(),
  whatHappens: z.string().optional(),
  lengthS: z.number().optional(),
  page: z.string().url().optional(), // the Shorti page for this video
});
export type TrendCard = z.infer<typeof TrendCard>;

export const Beat = z.object({ at: z.string(), do: z.string() });
export const VideoReading = z.object({
  videoId: z.string(),
  hook: z.string().default(""),
  turn: z.string().default(""),
  whatHappens: z.string().default(""),
  beats: z.array(Beat).default([]),
  checklist: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  props: z.array(z.string()).default([]),
});
export type VideoReading = z.infer<typeof VideoReading>;

export const OpenSpot = z.object({ label: z.string(), what: z.string(), how: z.string().default("") });
export const FormatPlan = z.object({
  formatId: z.string(),
  line: z.string(), // one sentence: how this format moves
  open: z.array(OpenSpot).default([]), // variations nobody has taken yet: "make the surface yours"
  page: z.string().url().optional(),
});
export type OpenSpot = z.infer<typeof OpenSpot>;
export type FormatPlan = z.infer<typeof FormatPlan>;

// ── The person's taste ───────────────────────────────────────────────────────
export const KeepPart = z.enum(["hook", "beat", "look", "sound"]);
export const TastePick = z.object({
  ghostId: z.string(),
  videoId: z.string(),
  url: z.string().url().optional(), // the original post, so a reading can be fetched later
  formatId: z.string().optional(),
  kept: z.boolean(),
  keep: z.array(KeepPart).default([]),
  note: z.string().max(200).optional(),
  at: z.string(),
});
export type KeepPart = z.infer<typeof KeepPart>;
export const Intent = z.enum(["keep", "adapt", "twist"]); // how close the ghost's take stays to the original
export type Intent = z.infer<typeof Intent>;
export type TastePick = z.infer<typeof TastePick>;

// ── Brief → render → check → queue ───────────────────────────────────────────
export const BriefLine = z.object({
  t: z.number().min(0).max(60), // seconds from start
  say: z.string().max(200), // what the ghost says (market language)
  do: z.string().max(200), // what the ghost does on screen
});
export const Brief = z.object({
  id: z.string(),
  ghostId: z.string(),
  sourceVideoId: z.string(),
  formatId: z.string().optional(),
  lang: Lang,
  durationSec: z.union([z.literal(10), z.literal(15)]),
  hook: z.string().max(160),
  lines: z.array(BriefLine).min(2).max(6),
  outfit: z.string().max(160),
  scene: z.string().max(200),
  caption: z.string().max(300),
  hashtags: z.array(z.string()).max(8),
  twist: z.string().max(200).default(""), // the open spot this take uses, if any
  intent: Intent.default("adapt"),
  status: z.enum(["draft", "approved"]),
  createdAt: z.string(),
});
export type BriefLine = z.infer<typeof BriefLine>;
export type Brief = z.infer<typeof Brief>;

// A clip rendered outside the live path (an owner-run CineSynth session) and placed in public/prerender/.
// Required whenever provider is "prerender", so the UI can say what it is and what it was rendered from.
export const PrerenderManifest = z.object({
  characterId: z.string().min(1),
  script: z.array(z.string()).min(1), // the approved "say" lines it was rendered from, in order
  durationSec: z.number().positive(),
  renderedBy: z.string().min(1), // who ran the owner session
  renderedAt: z.string().min(1),
  source: z.string().min(1), // e.g. "CineSynth talking_ad, owner session"
  briefId: z.string().optional(), // when it was rendered from a GhostReel brief
});
export type PrerenderManifest = z.infer<typeof PrerenderManifest>;

export const RenderJob = z
  .object({
    id: z.string(), // GhostReel's own id (a UUID); never the provider's
    briefId: z.string(),
    provider: z.enum(["newtype", "prerender"]), // prerender is always shown as such
    providerJobId: z.string().optional(), // CineSynth's job id, for status and download
    status: z.enum(["queued", "running", "done", "failed"]),
    videoUrl: z.string().url().optional(),
    posterUrl: z.string().url().optional(),
    manifest: PrerenderManifest.optional(),
    error: z.string().optional(),
    startedAt: z.string(),
    finishedAt: z.string().optional(),
  })
  .superRefine((job, ctx) => {
    if (job.provider === "prerender" && !job.manifest) {
      ctx.addIssue({ code: "custom", path: ["manifest"], message: "a prerendered clip carries its manifest" });
    }
  });
export type RenderJob = z.infer<typeof RenderJob>;

export const QueueItem = z.object({
  id: z.string(),
  ghostId: z.string(),
  renderId: z.string(),
  slot: z.string(), // ISO date
  platform: Platform,
  state: z.enum(["awaiting_approval", "approved"]), // nothing is ever posted from GhostReel
  deal: z.object({ seller: z.string(), product: z.string(), demo: z.literal(true) }).optional(),
});
export type QueueItem = z.infer<typeof QueueItem>;

// Every adapter answer carries where it came from, so the UI can label fixtures honestly.
export type Sourced<T> = { data: T; provenance: Provenance };

/** Whether a prerendered clip says exactly what this brief says (same spoken lines, same order). */
export function prerenderMatches(job: RenderJob, brief: Brief): boolean {
  if (job.provider !== "prerender" || !job.manifest) return false;
  const said = brief.lines.map((l) => l.say.trim());
  return job.manifest.script.length === said.length && job.manifest.script.every((line, i) => line.trim() === said[i]);
}
