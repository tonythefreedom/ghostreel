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
  clipUrl: z.string().url().optional(), // Shorti's own 720p copy of the hit, to play in place
  hook: z.string().optional(),
  whatHappens: z.string().optional(),
  lengthS: z.number().optional(),
  page: z.string().url().optional(), // the Shorti page for this video
});
export type TrendCard = z.infer<typeof TrendCard>;

export const Beat = z.object({ at: z.string(), do: z.string() });
// Where a coaching mark sits on the hit's frame, in shares of the frame (0–1): a box or a ring by its box, an outline,
// a line, an arrow or a bracket by its points. Its label is in the reading's language.
export const PencilMark = z.object({
  shape: z.enum(["box", "circle", "outline", "line", "arrow", "bracket"]),
  box: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  pts: z.array(z.tuple([z.number(), z.number()])).optional(),
  label: z.string().optional(),
});
export type PencilMark = z.infer<typeof PencilMark>;
// A coaching moment Shorti read in a hit: when (s), the craft point, what to do, what in the frame to look at, and
// where on the frame the pencil draws it.
export const HitCue = z.object({
  t: z.number(),
  cue: z.string(),
  do: z.string().default(""),
  look: z.array(z.string()).default([]),
  marks: z.array(PencilMark).default([]),
});
export type HitCue = z.infer<typeof HitCue>;
export const VideoReading = z.object({
  videoId: z.string(),
  hook: z.string().default(""),
  turn: z.string().default(""),
  whatHappens: z.string().default(""),
  beats: z.array(Beat).default([]),
  checklist: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  props: z.array(z.string()).default([]),
  cues: z.array(HitCue).default([]),
  cuts: z.array(z.number()).default([]), // measured cuts, seconds
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

// ── The creator (T8; approved into T2 with works optional) ──────────────────
export const Market = z.enum(["US", "KR", "JP", "Global"]);
export type Market = z.infer<typeof Market>;

export const CreatorInput = z.object({
  name: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(600).default(""),
  niche: z.string().trim().min(1).max(80),
  market: Market.default("US"),
  languages: z.array(Lang).min(1).max(4),
  ghostId: z.string().regex(/^[a-z0-9-]{1,40}$/), // the virtual human who performs; never the creator's own face
  works: z.array(z.string().trim().url().max(300)).max(10).default([]), // own past shorts; none is fine
  plan: z.string().trim().max(4000).default(""), // a past plan or pitch, pasted as text
  script: z.string().trim().max(4000).default(""), // a past script, pasted as text
});
export type CreatorInput = z.infer<typeof CreatorInput>;

// The CineSynth user a creator signed in as (Google, the same account CineSynth uses). Its status is CineSynth's:
// "pending" until CineSynth approves the email, and nothing renders before that.
export const CinesynthAccount = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string().default(""),
  picture: z.string().nullish(),
  role: z.string().default("user"),
  status: z.enum(["approved", "pending", "suspended"]),
});
export type CinesynthAccount = z.infer<typeof CinesynthAccount>;

export const Creator = CreatorInput.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  account: CinesynthAccount.pick({ id: true, email: true }).optional(), // who signed up; set by the server, never the form
});
export type Creator = z.infer<typeof Creator>;

// How a hit moves, beat by beat (shorti_recipe kind "edit"): what its hits share and what is free to change.
export const RecipeEdit = z.object({
  videoId: z.string(),
  lengthMs: z.number().optional(),
  bpm: z.number().optional(),
  hookFacts: z.array(z.string()).default([]), // measured facts about the opening, e.g. "The scene changes at 0.4 s"
  cues: z.array(z.object({ cue: z.string(), do: z.string(), share: z.string().default("") })).default([]),
  makeItYours: z.array(z.string()).default([]), // what the take may change
  free: z.array(z.string()).default([]), // parts its hits vary freely
});
export type RecipeEdit = z.infer<typeof RecipeEdit>;

// Where the phone stood in a hit (shorti_format part "scene"): one row per camera setup.
// Where the phone stood in a hit, per setup (Shorti's scene read, estimated): the camera preset a ghost's shot can take.
export const CameraSetup = z.object({
  tMs: z.number(),
  mount: z.string().default(""),
  move: z.string().default(""),
  height: z.string().default(""),
  distM: z.number().optional(),
  heightM: z.number().optional(),
  tiltDeg: z.number().optional(),
  vfovDeg: z.number().optional(),
  zoom: z.number().optional(),
});
export type CameraSetup = z.infer<typeof CameraSetup>;

// A format found by words or a product (shorti_find).
export const FindMatch = z.object({
  formatId: z.string(),
  title: z.string(),
  idea: z.string().default(""),
  videos: z.number().optional(),
  exampleUrl: z.string().url().optional(),
});
export type FindMatch = z.infer<typeof FindMatch>;

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
