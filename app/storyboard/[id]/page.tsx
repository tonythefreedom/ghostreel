// Lane B (T23). The storyboard for one brief: a scene per timed beat, in order, before the render.
import Link from "next/link";
import { notFound } from "next/navigation";
import { CameraPreset } from "@/components/CameraPreset";
import { ButtonLink, Verb, VerbSpacer } from "@/components/ui";
import { getLang } from "@/lib/lang";
import { z } from "zod";
import { StoryboardFrame } from "@/components/StoryboardFrame";
import { tasteKey } from "@/lib/creator";
import { getGhost } from "@/lib/newtype";
import { LineSuggestions, suggestionsFor } from "@/lib/lineSuggestions";
import { cameraSetups, FIELDS, formatPlan, hitCard, recipeEdit, trending } from "@/lib/shorti";
import { buildStoryboard, KeyframeManifest } from "@/lib/storyboard";
import { store } from "@/lib/store";
import type { Brief, TastePick } from "@/lib/types";
import { t } from "@/lib/words";
import lineData from "@/content/line-suggestions.json";
import keyframes from "@/public/prerender/keyframes.json";

export const dynamic = "force-dynamic";

const manifest = KeyframeManifest.parse(keyframes);
const lineSuggestions = LineSuggestions.parse(lineData);

// The post the brief was written from: the owner's kept pick first, else this week's deck.
async function sourceUrl(brief: Brief): Promise<string | null> {
  const picks = (await store.get<TastePick[]>(tasteKey(brief.ghostId, brief.owner))) ?? [];
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
  const lang = await getLang();
  const frames = buildStoryboard(brief, ghost, manifest);
  const made = frames.filter((f) => f.image).length;
  const url = await sourceUrl(brief);
  const [recipe, plan, setups, card] = await Promise.all([
    url ? recipeEdit(url) : Promise.resolve(null),
    brief.formatId ? formatPlan(brief.formatId) : Promise.resolve(null),
    url ? cameraSetups(url, lang) : Promise.resolve([]),
    url ? hitCard(brief.sourceVideoId, url, lang) : Promise.resolve(null),
  ]);
  const lines = suggestionsFor(brief, lineSuggestions, { recipe, spots: plan?.open ?? [] });
  const offered = lines.some((b) => b.length > 0);
  const locked = brief.status === "approved";

  return (
    <main className="flex min-h-dvh flex-col gap-6 pt-1">
      <Link href={`/brief/${brief.id}`} className="-ml-1 -mb-3 inline-flex min-h-11 items-center gap-1 self-start px-1 text-[13px] font-[560] text-text-dim hover:text-text">
        ← {t("briefTitle", lang)}
      </Link>
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-[560] text-text-dim">
          <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-[12px] font-[720] text-accent ring-1 ring-accent">
            {ghost.name.slice(0, 1)}
          </span>
          {ghost.name} · {t("sbTitle", lang)}
          <span className="font-mono text-[12px]">{brief.durationSec}s · 9:16 · {brief.lang.toUpperCase()}</span>
        </div>
        <h1 className="text-[22px] font-[720] leading-[1.27] tracking-[-0.01em]">{brief.hook}</h1>
        {lang === "ko" && brief.ko?.hook ? <p className="-mt-1 text-[15px] leading-snug text-text-dim">{brief.ko.hook}</p> : null}
        <p className="text-[13px] leading-snug text-text-3">
          <span className="font-mono">{frames.length}</span> {t("sbBeats", lang)} · <span className="font-mono">{made}</span> {t("sbReady", lang)}. {t("sbNote", lang)}
        </p>
        {offered ? (
          <p className="text-[12px] leading-snug text-text-3">
            {t("sbLines", lang)}
            {recipe?.bpm ? ` (${Math.round(recipe.bpm)} BPM, ${((recipe.lengthMs ?? 0) / 1000).toFixed(1)}s)` : ""}.{" "}
            {locked ? t("sbLocked", lang) : t("sbPickNow", lang)}
          </p>
        ) : null}
      </header>

      <ol className="grid grid-cols-2 gap-3">
        {frames.map((f) => (
          <StoryboardFrame key={f.index} frame={f}
            pick={{ briefId: brief.id, lines: brief.lines, options: lines[f.index] ?? [], locked }} />
        ))}
      </ol>

      <CameraPreset setups={setups} lang={lang} />

      <VerbSpacer />
      <Verb>
        <ButtonLink href={`/brief/${brief.id}`} size="xl" block>
          {t(brief.status === "approved" ? "sbToRender" : "sbToApprove", lang)}
        </ButtonLink>
      </Verb>
    </main>
  );
}
