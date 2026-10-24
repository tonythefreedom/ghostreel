// Lane A. The channel's pure rules: what state a brief is in, and which day of the week it takes.
// A brief carries no planned date, only when it was written, so the week is a queue: the briefs in the order they were
// written, oldest first, one a day from today (Seoul). Each row still says the day it was written; nothing is scheduled.
import type { Brief, RenderJob } from "@/lib/types";

export type BriefState = "draft" | "approved" | "queued" | "rendering" | "ready" | "failed";
export type WeekDay = { day: string; today: boolean; brief?: Brief; state?: BriefState };

const DAY_MS = 86_400_000;
const KST_MS = 9 * 3_600_000;

/** The Seoul calendar day of an instant, as YYYY-MM-DD. */
export function seoulDay(ms: number): string {
  return new Date(ms + KST_MS).toISOString().slice(0, 10);
}

export function stateOf(brief: Brief, job: RenderJob | null | undefined): BriefState {
  if (brief.status === "draft") return "draft";
  if (!job) return "approved";
  if (job.status === "done") return job.videoUrl ? "ready" : "failed";
  if (job.status === "running") return "rendering";
  return job.status; // queued | failed
}

/** Oldest first: the order the week and the verb read briefs in. */
export function byWritten(briefs: Brief[]): Brief[] {
  return [...briefs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Seven days from today, each holding the next brief in written order; `later` counts the briefs past the week. */
export function week(briefs: Brief[], jobs: Map<string, RenderJob>, now: number): { days: WeekDay[]; later: number } {
  const queue = byWritten(briefs);
  const days = Array.from({ length: 7 }, (_, i): WeekDay => {
    const brief = queue[i];
    return { day: seoulDay(now + i * DAY_MS), today: i === 0, brief, state: brief ? stateOf(brief, jobs.get(brief.id)) : undefined };
  });
  return { days, later: Math.max(0, queue.length - days.length) };
}
