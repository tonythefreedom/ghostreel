// Lane B (T23). The storyboard for one brief: a scene per timed beat, in order, before the render.
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StoryboardFrame } from "@/components/StoryboardFrame";
import { getGhost } from "@/lib/newtype";
import { LineSuggestions, suggestionsFor } from "@/lib/lineSuggestions";
import { FIELDS, formatPlan, recipeEdit, trending } from "@/lib/shorti";
import { buildStoryboard, KeyframeManifest } from "@/lib/storyboard";
import { store } from "@/lib/store";
import type { Brief, TastePick } from "@/lib/types";
import lineData from "@/content/line-suggestions.json";
import keyframes from "@/public/prerender/keyframes.json";

export const dynamic = "force-dynamic";

const manifest = KeyframeManifest.parse(keyframes);
const lineSuggestions = LineSuggestions.parse(lineData);

// The post the brief was written from: the owner's kept pick first, else this week's deck.
async function sourceUrl(brief: Brief): Promise<string | null> {
  const picks = (await store.get<TastePick[]>(`taste:${brief.ghostId}`)) ?? [];
  const kept = picks.find((p) => p.videoId === brief.sourceVideoId && p.url)?.url;
  if (kept) return kept;
  for (const field of FIELDS) {
    const card = (await trending(field)).data.cards.find((c) => c.videoId === brief.sourceVideoId);
    if (card) return card.url;
  }
  return null;
}

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const brief = await store.get<Brief>(`brief:${id}`);
  if (!brief) notFound();
  const ghost = await getGhost(brief.ghostId);
  if (!ghost) notFound();
  const frames = buildStoryboard(brief, ghost, manifest);
  const made = frames.filter((f) => f.image).length;
  const url = await sourceUrl(brief);
  const [recipe, plan] = await Promise.all([
    url ? recipeEdit(url) : Promise.resolve(null),
    brief.formatId ? formatPlan(brief.formatId) : Promise.resolve(null),
  ]);
  const lines = suggestionsFor(brief, lineSuggestions, { recipe, spots: plan?.open ?? [] });
  const offered = lines.some((b) => b.length > 0);
  const locked = brief.status === "approved";

  return (
    <main className="flex min-h-dvh flex-col gap-5 py-6 pb-28">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-text">
            {ghost.name.slice(0, 1)}
          </span>
          {ghost.name} · Storyboard
          <span className="font-mono text-[11px]">{brief.durationSec}s · 9:16 · {brief.lang.toUpperCase()}</span>
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">{brief.hook}</h1>
        <p className="text-[13px] text-text-dim">
          {frames.length} beats · {made} scenes ready. Scenes are made with CineSynth; until then each shows the prompt it will use.
        </p>
        {offered ? (
          <p className="text-[12px] text-text-dim">
            GhostReel wrote the line options; each shows, in Shorti's own words, the move, opening or open spot it read in the source
            {recipe?.bpm ? ` (source ${Math.round(recipe.bpm)} BPM, ${((recipe.lengthMs ?? 0) / 1000).toFixed(1)} s)` : ""}.
            {locked ? " The brief is approved, so it can't change." : " Picking one updates the brief right away."}
          </p>
        ) : null}
      </header>

      <ol className="grid grid-cols-2 gap-3">
        {frames.map((f) => (
          <StoryboardFrame key={f.index} frame={f}
            pick={{ briefId: brief.id, lines: brief.lines, options: lines[f.index] ?? [], locked }} />
        ))}
      </ol>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-[430px] px-4">
          <Link href={`/brief/${brief.id}`}
            className="grid h-14 w-full place-items-center rounded-[var(--radius-card)] bg-accent text-[15px] font-extrabold">
            {brief.status === "approved" ? "See the brief and render" : "Back to the brief to approve"}
          </Link>
        </div>
      </div>
    </main>
  );
}
