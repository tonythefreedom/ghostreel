// The ghost's brief: the owner edits the draft, then approves it; only an approved brief can render.
import { notFound } from "next/navigation";
import { z } from "zod";
import { BriefEditor } from "@/components/BriefEditor";
import { getGhost } from "@/lib/newtype";
import { store } from "@/lib/store";
import type { Brief, RenderJob, TastePick } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const brief = await store.get<Brief>(`brief:${id}`);
  if (!brief) notFound();
  const [ghost, jobId, picks] = await Promise.all([
    getGhost(brief.ghostId),
    store.get<string>(`renderFor:${brief.id}`),
    store.get<TastePick[]>(`taste:${brief.ghostId}`),
  ]);
  const job = jobId ? await store.get<RenderJob>(`render:${jobId}`) : null;
  // What the owner kept from the original in /taste, remembered here as words.
  const kept = picks?.find((p) => p.videoId === brief.sourceVideoId && p.kept)?.keep ?? [];

  return (
    <main className="flex min-h-dvh flex-col py-6">
      <BriefEditor
        initial={brief}
        initialJob={job}
        ghost={{ id: brief.ghostId, name: ghost?.name ?? brief.ghostId, portraitUrl: ghost?.portraitUrl }}
        kept={kept}
      />
    </main>
  );
}
