// The ghost's brief: the owner edits the draft, then approves it; only an approved brief can render.
import { notFound } from "next/navigation";
import { z } from "zod";
import { BriefEditor } from "@/components/BriefEditor";
import { getGhost } from "@/lib/newtype";
import { store } from "@/lib/store";
import type { Brief, RenderJob } from "@/lib/types";
import { t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const brief = await store.get<Brief>(`brief:${id}`);
  if (!brief) notFound();
  const ghost = await getGhost(brief.ghostId);
  const jobId = await store.get<string>(`renderFor:${brief.id}`);
  const job = jobId ? await store.get<RenderJob>(`render:${jobId}`) : null;

  return (
    <main className="flex min-h-dvh flex-col gap-4 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-text">
            {(ghost?.name ?? "?").slice(0, 1)}
          </span>
          {ghost?.name} · {t("briefTitle")}
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px]">{t(brief.status === "approved" ? "approved" : "draft")}</span>
        </div>
        {brief.twist ? (
          <p className="text-[13px] text-ghost">
            {t("twistUsed")} · {brief.twist}
          </p>
        ) : null}
      </header>
      <BriefEditor initial={brief} initialJob={job} />
    </main>
  );
}
