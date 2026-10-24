// The ghost's brief: the owner edits the draft, then approves it; only an approved brief can render. Under the brief,
// the short it learns from plays with Shorti's coaching pencil, and the 4D camera preset shows where its phone stood.
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BriefEditor } from "@/components/BriefEditor";
import { CameraPreset } from "@/components/CameraPreset";
import { Player } from "@/components/ui";
import { hitCues } from "@/lib/cues";
import { withFace } from "@/lib/ghostFace";
import { getLang } from "@/lib/lang";
import { getGhost } from "@/lib/newtype";
import { pickClip } from "@/lib/newtype/prerender";
import { startDriver } from "@/lib/newtype/runner";
import { cameraSetups, hitCard, reading } from "@/lib/shorti";
import { store } from "@/lib/store";
import type { Brief, RenderJob, TastePick } from "@/lib/types";
import { t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const brief = await store.get<Brief>(`brief:${id}`);
  if (!brief) notFound();
  const lang = await getLang();
  const [ghost, jobId, picks] = await Promise.all([
    getGhost(brief.ghostId),
    store.get<string>(`renderFor:${brief.id}`),
    store.get<TastePick[]>(`taste:${brief.ghostId}`),
  ]);
  const job = jobId ? await store.get<RenderJob>(`render:${jobId}`) : null;
  startDriver(); // a live render moves on the server; the page reads it as it stands
  const clip = (() => {
    try {
      return pickClip(brief.ghostId, brief.lang);
    } catch {
      return null;
    }
  })();
  const fallback = clip ? { src: `/prerender/${clip.file}`, poster: clip.poster ? `/prerender/${clip.poster}` : undefined } : undefined;
  // What the owner kept from the original in /taste, remembered here as words.
  const pick = picks?.find((p) => p.videoId === brief.sourceVideoId);
  const kept = pick?.kept ? pick.keep : [];
  const [card, read, setups] = pick?.url
    ? await Promise.all([hitCard(brief.sourceVideoId, pick.url, lang), reading(brief.sourceVideoId, pick.url, lang), cameraSetups(pick.url, lang)])
    : [null, null, []];

  const source = card?.clipUrl ? (
    <section aria-labelledby="source" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="source" className="text-[18px] font-[720] tracking-[-0.01em]">{t("sourceTitle", lang)}</h2>
        <p className="text-[13px] leading-snug text-text-3">{t("sourceLine", lang)}</p>
      </div>
      <div className="w-[78%] self-center">
        <Player src={card.clipUrl} poster={card.posterUrl} ai={false} label={card.hook} cues={hitCues(read)} cuts={read?.cuts} autoPlay={false} />
      </div>
      <p className="text-[13px] text-text-3">{[card.by, card.hook].filter(Boolean).join(" · ")}</p>
    </section>
  ) : null;

  return (
    <main className="flex min-h-dvh flex-col pt-1">
      <Link href={`/ghost/${brief.ghostId}`} className="-ml-1 mb-2 inline-flex min-h-11 items-center gap-1 self-start px-1 text-[13px] font-[560] text-text-dim hover:text-text">
        ← {ghost?.name ?? brief.ghostId} {t("backToChannel", lang)}
      </Link>
      <BriefEditor
        initial={brief}
        initialJob={job}
        fallback={fallback}
        ghost={{ id: brief.ghostId, name: ghost?.name ?? brief.ghostId, portraitUrl: ghost ? withFace(ghost).portraitUrl : undefined }}
        kept={kept}
        extra={
          source || setups.length ? (
            <div className="flex flex-col gap-10 pt-4">
              {source}
              <CameraPreset setups={setups} lang={lang} page={card?.page ? `${card.page}?m=4d` : undefined} />
            </div>
          ) : null
        }
      />
    </main>
  );
}
