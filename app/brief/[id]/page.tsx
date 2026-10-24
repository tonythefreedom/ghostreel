// The ghost's draft brief, read-only for now (editing and approve-to-render land in T11).
import { notFound } from "next/navigation";
import { z } from "zod";
import { getGhost } from "@/lib/newtype";
import { store } from "@/lib/store";
import type { Brief } from "@/lib/types";
import { t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const brief = await store.get<Brief>(`brief:${id}`);
  if (!brief) notFound();
  const ghost = await getGhost(brief.ghostId);

  return (
    <main className="flex min-h-dvh flex-col gap-5 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-text">
            {(ghost?.name ?? "?").slice(0, 1)}
          </span>
          {ghost?.name} · {t("briefTitle")}
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px]">{t("draft")}</span>
          <span className="font-mono text-[11px]">{brief.durationSec}s · 9:16 · {brief.lang.toUpperCase()}</span>
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">{brief.hook}</h1>
        {brief.twist ? (
          <p className="text-[13px] text-ghost">
            {t("twistUsed")} · {brief.twist}
          </p>
        ) : null}
      </header>

      <ol className="flex flex-col gap-3">
        {brief.lines.map((line, i) => (
          <li key={i} className="grid grid-cols-[3rem_1fr] gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <span className="font-mono text-[13px] text-accent">{line.t.toFixed(1)}s</span>
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-semibold">“{line.say}”</p>
              <p className="text-[13px] text-text-dim">{line.do}</p>
            </div>
          </li>
        ))}
      </ol>

      <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2 text-[13px]">
        <dt className="text-text-dim">{t("outfit")}</dt>
        <dd>{brief.outfit}</dd>
        <dt className="text-text-dim">{t("scene")}</dt>
        <dd>{brief.scene}</dd>
        <dt className="text-text-dim">{t("caption")}</dt>
        <dd>
          {brief.caption}
          <span className="mt-1 block text-accent">{brief.hashtags.map((h) => `#${h}`).join(" ")}</span>
        </dd>
      </dl>
    </main>
  );
}
