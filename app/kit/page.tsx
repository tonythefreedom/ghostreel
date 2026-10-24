// Lane B (gift from Lane A, 10-24). Development only: every kit piece on one page with sample data, to see and
// try before placing it. Any build returns 404.
import { notFound } from "next/navigation";
import { KitPreview } from "@/components/kit/Preview";
import { listCharacters } from "@/lib/newtype";
import type { RenderJob } from "@/lib/types";

export default async function KitPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const ghosts = await listCharacters();
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  const states: RenderJob["status"][] = ["done", "running", "queued", "failed", "done", "done"];
  const jobs: RenderJob[] = states.map((status, i) => ({
    id: `kit-${i}`,
    briefId: `kit-brief-${i}`,
    provider: "newtype",
    status,
    // Only the ghost's own keyframe: a real creator's poster must never sit under an "AI" mark. No clip ships with
    // the repo, so the poster stands in and the player shows it when the file is missing.
    videoUrl: status === "done" ? "/prerender/kit-preview.mp4" : undefined,
    posterUrl: i % 2 === 0 ? "/prerender/keyframes/default-percent-ready-0.jpg" : undefined,
    error: status === "failed" ? "CineSynth timed out" : undefined,
    startedAt: ago(5 + i * 90),
    finishedAt: status === "done" || status === "failed" ? ago(i * 90) : undefined,
  }));
  return <KitPreview ghosts={ghosts} jobs={jobs} />;
}
