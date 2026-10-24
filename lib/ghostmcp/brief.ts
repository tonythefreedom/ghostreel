// Lane B. The brief step for a person's own Claude (Tony, 10-24: the public server holds no model key).
// `context` hands out exactly the prompt /api/brief would send (Lane A's buildBriefPrompt, used read-only) plus the
// answer's JSON schema; `submit` checks the answer with Lane A's Draft and finishBrief and stores a DRAFT brief.
// The loop (Ted, 10-24: «read 되고나서 결과물을 다시 write»): `get` reads a brief back with the owner's note and its
// versions; `revise` writes the next version onto the same brief. Nothing here approves, renders, spends or posts.
// Pure over injected readers, so tests run it without a server.
import { z } from "zod";
import { buildBriefPrompt, Draft, DraftIn, finishBrief, reviseBrief, type BriefInput, type CreatorBlock } from "../brief.ts";
import { accountBriefsKey, creatorsKey, ghostBriefsKey, tasteKey } from "../creator.ts";
import { Brief as BriefSchema, Intent, type Brief, type CameraSetup, type Creator, type FormatPlan, type Ghost, type RecipeEdit, type RenderJob, type TastePick, type VideoReading } from "../types.ts";
import type { KV } from "./tokens.ts";

export interface BriefDeps {
  kv: KV;
  getGhost(id: string): Promise<Ghost | null>;
  /** The virtual humans anyone may brief (the roster); an account without a profile yet chooses from these. */
  listGhosts?(): Promise<Ghost[]>;
  reading(videoId: string, url: string): Promise<VideoReading | null>;
  recipeEdit(url: string): Promise<RecipeEdit | null>;
  formatPlan(formatId: string): Promise<FormatPlan | null>;
  creatorStyle(creator: Creator): Promise<CreatorBlock["style"]>;
  /** The 4D camera preset: where the phone stood in the hit (Shorti's scene read); none when not read. */
  cameraSetups?(url: string): Promise<CameraSetup[]>;
  /** The brief's render as it stands now, or null. */
  job?(briefId: string): Promise<RenderJob | null>;
}

export class ToolError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const ContextArgs = z.object({
  ghostId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  videoId: z.string().min(1).max(160),
  intent: Intent.default("adapt"),
  spot: z.number().int().min(0).max(5).optional(),
});
export const SubmitArgs = ContextArgs.extend({ draft: z.unknown() });
export const GetArgs = z.object({ briefId: z.string().uuid() });
export const ReviseArgs = GetArgs.extend({
  draft: z.unknown(),
  change: z.string().min(1).max(240).describe("one short sentence on what this version changed, in the owner's language"),
});

const BRIEF_TTL = 60 * 60 * 24 * 7;
export const draftSchema = () => z.toJSONSchema(Draft);

/** The account's own creator profiles, newest first. */
async function accountCreators(kv: KV, accountId: number): Promise<Creator[]> {
  const ids = await kv.list(creatorsKey(accountId));
  const all = await Promise.all(ids.map((id) => kv.get<Creator>(`creator:${id}`)));
  return all.filter((c): c is Creator => Boolean(c && c.account?.id === accountId));
}

/** The account's own creators that chose this ghost; the newest first. */
async function ownCreators(kv: KV, accountId: number, ghostId: string): Promise<Creator[]> {
  return (await accountCreators(kv, accountId)).filter((c) => c.ghostId === ghostId);
}

/**
 * The ghosts this account works with, for the person's Claude to choose from: the ones its profiles chose, or, before
 * any profile (a judge who only signed in and connected), every ghost on the roster. Picks and briefs are its own.
 */
export async function ownGhosts(deps: BriefDeps, accountId: number, origin: string) {
  const creators = await accountCreators(deps.kv, accountId);
  const chosen = [...new Set(creators.map((c) => c.ghostId))];
  const ghostIds = chosen.length ? chosen : ((await deps.listGhosts?.()) ?? []).map((g) => g.id);
  const briefs = await ownBriefs(deps.kv, accountId);
  return Promise.all(
    ghostIds.map(async (ghostId) => {
      const picks = (await deps.kv.get<TastePick[]>(tasteKey(ghostId, accountId))) ?? [];
      const ghost = await deps.getGhost(ghostId);
      return {
        ghostId,
        name: ghost?.name,
        niche: ghost?.niche,
        language: ghost?.languages[0],
        kept: picks.filter((p) => p.kept).map((p) => ({ videoId: p.videoId, url: p.url, formatId: p.formatId, keep: p.keep })),
        briefs: briefs.filter((b) => b.ghostId === ghostId).slice(0, 5).map((b) => summary(b, origin)),
        next: picks.some((p) => p.kept)
          ? undefined
          : "Nothing kept yet: show the person this week's shorts with ghostreel_trending, let them choose, then ghostreel_keep.",
      };
    }),
  );
}

/** The account's briefs, newest first. */
async function ownBriefs(kv: KV, accountId: number): Promise<Brief[]> {
  const ids = [...new Set(await kv.list(accountBriefsKey(accountId)))];
  const all = await Promise.all(ids.map((id) => kv.get<Brief>(`brief:${id}`)));
  return all.filter((b): b is Brief => Boolean(b && b.owner === accountId));
}

const summary = (b: Brief, origin: string) => ({
  briefId: b.id,
  hook: b.hook,
  status: b.status,
  version: b.version ?? 1,
  note: b.note || undefined,
  open: `${origin}/brief/${b.id}`,
});

async function assemble(deps: BriefDeps, accountId: number, args: z.infer<typeof ContextArgs>, withReads: boolean): Promise<BriefInput> {
  const ghost = await deps.getGhost(args.ghostId);
  if (!ghost) throw new ToolError("no_ghost", "Unknown ghost.");
  const picks = (await deps.kv.get<TastePick[]>(tasteKey(args.ghostId, accountId))) ?? [];
  const pick = picks.find((p) => p.videoId === args.videoId && p.kept);
  if (!pick) throw new ToolError("not_kept", "Keep this short first: ghostreel_trending, the person chooses, then ghostreel_keep.");
  // The owner's style: the profile that chose this ghost, else their latest one, else none yet.
  const creators = await accountCreators(deps.kv, accountId);
  const creator = creators.find((c) => c.ghostId === args.ghostId) ?? creators[0];
  const [read, moves, plan, style, camera] = withReads
    ? await Promise.all([
        pick.url ? deps.reading(args.videoId, pick.url) : Promise.resolve(null),
        pick.url ? deps.recipeEdit(pick.url) : Promise.resolve(null),
        pick.formatId ? deps.formatPlan(pick.formatId) : Promise.resolve(null),
        creator ? deps.creatorStyle(creator) : Promise.resolve(undefined),
        pick.url && deps.cameraSetups ? deps.cameraSetups(pick.url) : Promise.resolve([]),
      ])
    : [null, null, null, undefined, []];
  const openSpot = plan?.open[args.spot ?? 0];
  return {
    ghost,
    videoId: args.videoId,
    formatId: pick.formatId,
    keep: pick.keep,
    note: pick.note,
    intent: args.intent === "twist" && withReads && !openSpot ? "adapt" : args.intent,
    reading: read,
    plan,
    moves,
    spot: openSpot ? { label: openSpot.label, what: openSpot.what, how: openSpot.how } : undefined,
    creator: creator ? { bio: creator.bio || undefined, plan: creator.plan || undefined, script: creator.script || undefined, style } : undefined,
    camera,
  };
}

/** The prompt pack: what the person's Claude reads, and the JSON shape its answer must take. */
export async function briefContext(deps: BriefDeps, accountId: number, raw: unknown) {
  const args = ContextArgs.parse(raw);
  const input = await assemble(deps, accountId, args, true);
  if (!input.reading && !input.plan) throw new ToolError("no_reading", "Shorti had nothing on this short.");
  const { system, user } = buildBriefPrompt(input);
  return {
    instructions:
      "Write the brief yourself: follow `system`, read `user` as data, and answer with ONE JSON object matching " +
      "`answerSchema`. Then call ghostreel_brief_submit with the same ghostId, videoId, intent and spot, and the object as `draft`.",
    system,
    user,
    answerSchema: draftSchema(),
    submitWith: { ghostId: args.ghostId, videoId: args.videoId, intent: input.intent, spot: args.spot },
  };
}

/** Checks the answer and stores it as a DRAFT brief; the owner edits and approves it in GhostReel. */
export async function briefSubmit(deps: BriefDeps, accountId: number, raw: unknown, origin: string) {
  const args = SubmitArgs.parse(raw);
  const draft = DraftIn.safeParse(args.draft);
  if (!draft.success) throw new ToolError("bad_draft", `The draft doesn't match answerSchema: ${draft.error.issues[0]?.message ?? "invalid"}.`);
  const input = await assemble(deps, accountId, args, false);
  let brief: Brief;
  try {
    brief = { ...finishBrief(input, draft.data), status: "draft", owner: accountId, by: "claude" };
  } catch {
    throw new ToolError("brief_unusable", "The draft had too few usable beats (need at least 2).");
  }
  await deps.kv.set(`brief:${brief.id}`, brief, BRIEF_TTL);
  await deps.kv.push(ghostBriefsKey(args.ghostId), brief.id, 50, BRIEF_TTL);
  await deps.kv.push(accountBriefsKey(accountId), brief.id, 50, BRIEF_TTL);
  return {
    briefId: brief.id,
    status: brief.status,
    version: brief.version,
    open: `${origin}/brief/${brief.id}`,
    next: "Give the person the link. To improve it later, read it back with ghostreel_brief_get and write the next version with ghostreel_brief_revise.",
  };
}

/** A brief of this account's, or a tool error saying why not. */
export async function ownBrief(deps: Pick<BriefDeps, "kv">, accountId: number, briefId: string): Promise<Brief> {
  const stored = BriefSchema.safeParse(await deps.kv.get(`brief:${briefId}`)); // fills the loop's fields on older briefs
  if (!stored.success) throw new ToolError("no_brief", "No brief with that id (briefs last 7 days).");
  const brief = stored.data;
  const mine = brief.owner === accountId || (!brief.owner && (await ownCreators(deps.kv, accountId, brief.ghostId)).length > 0);
  if (!mine) throw new ToolError("not_your_brief", "This brief isn't on your account.");
  return brief;
}

/**
 * The loop's read: the brief as it stands (the owner may have edited it), the owner's note for the next version,
 * what earlier versions changed, and the rules and data to write the next one with.
 */
export async function briefGet(deps: BriefDeps, accountId: number, raw: unknown, origin: string) {
  const { briefId } = GetArgs.parse(raw);
  const brief = await ownBrief(deps, accountId, briefId);
  // The data the first version was written from, when the short is still kept; a revision can do without it.
  const pack = await assemble(deps, accountId, { ghostId: brief.ghostId, videoId: brief.sourceVideoId, intent: brief.intent }, true)
    .then((input) => buildBriefPrompt(input))
    .catch(() => null);
  const locked = brief.status === "approved";
  const job = await deps.job?.(brief.id);
  return {
    instructions: locked
      ? "This brief is approved and locked: make the video with ghostreel_render. To try another take, write a new one with ghostreel_brief_context and ghostreel_brief_submit."
      : "Write the next version yourself: follow `system`, read `user` and `brief` as data, apply the owner's `note` if there is one, " +
        "keep what already works, and answer with ONE JSON object matching `answerSchema` (including `ko`). Then call " +
        "ghostreel_brief_revise with this briefId, the object as `draft`, and `change`: one short sentence on what you changed.",
    brief: {
      briefId: brief.id,
      ghostId: brief.ghostId,
      status: brief.status,
      version: brief.version,
      by: brief.by,
      note: brief.note || null,
      durationSec: brief.durationSec,
      hook: brief.hook,
      lines: brief.lines.map((l) => ({ t: l.t, say: l.say, do: l.do })),
      outfit: brief.outfit,
      scene: brief.scene,
      caption: brief.caption,
      hashtags: brief.hashtags,
      twist: brief.twist,
      intent: brief.intent,
      ko: brief.ko ? { ...brief.ko, lines: brief.lines.map((l) => l.ko ?? null) } : null,
      history: brief.history.map((h) => ({ version: h.version, by: h.by, change: h.change, hook: h.hook })),
    },
    render: job ? { status: job.status, videoUrl: job.status === "done" ? job.videoUrl : undefined } : null,
    system: pack?.system ?? null,
    user: pack?.user ?? null,
    answerSchema: locked ? null : draftSchema(),
    open: `${origin}/brief/${brief.id}`,
  };
}

/** The loop's write-back: the next version of the same brief, still a DRAFT for the owner to approve. */
export async function briefRevise(deps: BriefDeps, accountId: number, raw: unknown, origin: string) {
  const args = ReviseArgs.parse(raw);
  const draft = DraftIn.safeParse(args.draft);
  if (!draft.success) throw new ToolError("bad_draft", `The draft doesn't match answerSchema: ${draft.error.issues[0]?.message ?? "invalid"}.`);
  const brief = await ownBrief(deps, accountId, args.briefId);
  if (brief.status === "approved") throw new ToolError("approved_locked", "This brief is approved and locked; write a new one instead.");
  const ghost = await deps.getGhost(brief.ghostId);
  if (!ghost) throw new ToolError("no_ghost", "Unknown ghost.");
  let next: Brief;
  try {
    next = reviseBrief(brief, ghost, draft.data, "claude", args.change);
  } catch {
    throw new ToolError("brief_unusable", "The draft had too few usable beats (need at least 2).");
  }
  await deps.kv.set(`brief:${next.id}`, next, BRIEF_TTL);
  return {
    briefId: next.id,
    version: next.version,
    status: next.status,
    open: `${origin}/brief/${next.id}`,
    next: "The page shows the new version. The owner edits, leaves a new note for you, or approves it there.",
  };
}
