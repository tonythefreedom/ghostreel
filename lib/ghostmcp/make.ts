// The whole make, from the person's own Claude (Ted, 10-24: «MCP를 통해 클로드 구독토큰으로 영상 만들수있다는 거를 …
// 심사위원들이 꼭 테스트해볼 수 있게»). With only a Google sign-in and a connect token, Claude shows this week's
// rising shorts, keeps the one the person chose, writes and refines the brief (brief.ts), and once the person has
// approved it on the site (which starts the render as their own CineSynth account), follows the render and hands back
// the video. Approval stays the person's, on the site: it is the consent before any GPU spend. Pure over injected
// deps, so tests run it without a server.
import { z } from "zod";
import { tasteKey } from "../creator.ts";
import { KeepPart, prerenderMatches, type Brief, type Ghost, type RenderJob, type TastePick, type TrendCard } from "../types.ts";
import { ownBrief, ToolError } from "./brief.ts";
import type { KV } from "./tokens.ts";

export const FIELDS = ["beauty", "fashion"] as const;

export interface MakeDeps {
  kv: KV;
  getGhost(id: string): Promise<Ghost | null>;
  /** This week's deck for a field (Shorti, keyless; a recorded deck when it is down). */
  trending?(field: (typeof FIELDS)[number]): Promise<TrendCard[]>;
  /** Starts the render of an approved brief (spend-guarded by the caller), or returns the one it already has. */
  render?(brief: Brief): Promise<RenderJob | { error: string }>;
  /** The brief's render as it stands now, or null. */
  job?(briefId: string): Promise<RenderJob | null>;
}

export const TrendingArgs = z.object({ field: z.enum(FIELDS).default("beauty") });
export const KeepArgs = z.object({
  ghostId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  videoId: z.string().min(1).max(160),
  keep: z.array(KeepPart).min(1).max(4).default(["hook"]).describe("what of that short the ghost keeps"),
  note: z.string().max(200).optional().describe("the person's own words on why, if they gave any"),
});
export const RenderArgs = z.object({ briefId: z.string().uuid() });

const ROUND = 8; // the same eight the taste deck shows
const TTL = 60 * 60 * 24 * 7;

/** This week's rising shorts, for the person to choose from. Views are the platform's counts as read, never a forecast. */
export async function trendingShorts(deps: MakeDeps, raw: unknown) {
  const { field } = TrendingArgs.parse(raw);
  const cards = ((await deps.trending?.(field)) ?? []).slice(0, ROUND);
  return {
    field,
    shorts: cards.map((c) => ({
      videoId: c.videoId,
      url: c.url,
      platform: c.platform,
      by: c.by,
      hook: c.hook,
      whatHappens: c.whatHappens,
      format: c.formatTitle,
      views: c.views,
      viewsAsOf: c.viewsAsOf,
    })),
    next: "Show these to the person and let them choose; keep only what they chose with ghostreel_keep. Never say a count forecasts views.",
  };
}

/** Keeps a short the person chose on their own taste deck for that ghost (the same deck the site shows). */
export async function keepShort(deps: MakeDeps, accountId: number, raw: unknown, origin: string) {
  const args = KeepArgs.parse(raw);
  if (!(await deps.getGhost(args.ghostId))) throw new ToolError("no_ghost", "Unknown ghost; use a ghostId from ghostreel_ghosts.");
  let card: TrendCard | undefined;
  for (const field of FIELDS) {
    card = ((await deps.trending?.(field)) ?? []).find((c) => c.videoId === args.videoId);
    if (card) break;
  }
  if (!card) throw new ToolError("not_this_week", "That short isn't on this week's deck; pick one from ghostreel_trending.");
  const key = tasteKey(args.ghostId, accountId);
  const picks = ((await deps.kv.get<TastePick[]>(key)) ?? []).filter((p) => p.videoId !== args.videoId);
  const pick: TastePick = {
    ghostId: args.ghostId, videoId: card.videoId, url: card.url, formatId: card.formatId, kept: true, keep: args.keep,
    note: args.note, at: new Date().toISOString(),
  };
  await deps.kv.set(key, [...picks, pick].slice(-60), TTL);
  return {
    kept: { ghostId: args.ghostId, videoId: card.videoId, keep: args.keep },
    deck: `${origin}/taste?ghost=${args.ghostId}`,
    next: "Now write the brief: ghostreel_brief_context with this ghostId and videoId, then ghostreel_brief_submit.",
  };
}

const reel = (job: RenderJob, brief: Brief) => ({
  status: job.status,
  stage: job.stage,
  progress: job.progress,
  etaAt: job.etaAt,
  lipSync: job.lipSync,
  notice: job.notice,
  videoUrl: job.status === "done" ? job.videoUrl : undefined,
  posterUrl: job.posterUrl,
  // A clip made ahead of time is said to be one, and whether it was made from these very lines.
  prerendered: job.provider === "prerender" || undefined,
  fromThisBrief: job.provider === "prerender" ? prerenderMatches(job, brief) : undefined,
  error: job.error,
});

/**
 * The video: starts the render of an approved brief (one job per brief, never paid twice) or reports the one it has.
 * A draft is refused with the link where the person approves it; only they can.
 */
export async function renderBrief(deps: MakeDeps, accountId: number, raw: unknown, origin: string) {
  const { briefId } = RenderArgs.parse(raw);
  const brief = await ownBrief(deps, accountId, briefId);
  const open = `${origin}/brief/${brief.id}`;
  if (brief.status !== "approved") {
    return {
      status: "needs_approval",
      open,
      next: "Ask the person to open the link and press Approve (only they can approve; it is their consent before the render). Then call ghostreel_render again.",
    };
  }
  const existing = await deps.job?.(brief.id);
  const job = existing && existing.status !== "failed" ? existing : await deps.render?.(brief);
  if (!job) throw new ToolError("render_unavailable", "Rendering isn't available on this server right now.");
  if (!("id" in job)) {
    if (job.error === "start_on_site") {
      return {
        status: "needs_render_on_site",
        open,
        next: "The render runs as the person's own CineSynth account: ask them to open the link and press Render. Then call ghostreel_render again to follow it.",
      };
    }
    throw new ToolError(job.error, job.error === "daily_cap" ? "Today's render cap is used up; try tomorrow." : "The render couldn't start.");
  }
  const now = reel(job, brief);
  return {
    ...now,
    open,
    next:
      job.status === "done"
        ? "Give the person the video link and the brief page; the reel carries the AI label."
        : job.status === "failed"
          ? "The render failed; call ghostreel_render again to retry, or tell the person."
          : "Rendering takes a few minutes (stage, progress and etaAt say where it is). Call ghostreel_render again with the same briefId to check.",
  };
}
