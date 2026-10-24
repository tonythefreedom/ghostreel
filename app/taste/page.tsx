import Link from "next/link";
import { notFound } from "next/navigation";
import { TasteSwipe } from "@/components/TasteSwipe";
import { DemoTag } from "@/components/TrustLine";
import { VerbSpacer } from "@/components/ui";
import { getLang } from "@/lib/lang";
import { getGhost } from "@/lib/newtype";
import { FIELDS, reading, trending, type Field } from "@/lib/shorti";
import type { VideoReading } from "@/lib/types";
import { nicheIn, shortDate, t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function TastePage({ searchParams }: { searchParams: Promise<{ ghost?: string; field?: string; creator?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const ghost = await getGhost(sp.ghost ?? "yuna");
  if (!ghost) notFound();
  const field: Field = (FIELDS as readonly string[]).includes(sp.field ?? "") ? (sp.field as Field) : "beauty";
  const { data, provenance } = await trending(field, lang);
  const creatorId = /^[0-9a-f-]{36}$/i.test(sp.creator ?? "") ? sp.creator : undefined; // the route checks it is real
  // Shorti's reading of each card, in the page's language: the coaching pencil writes its cues on the playing hit.
  const read = await Promise.all(data.cards.slice(0, 20).map(async (c) => [c.videoId, await reading(c.videoId, c.url, lang)] as const));
  const readings: Record<string, VideoReading> = Object.fromEntries(read.filter((r): r is readonly [string, VideoReading] => r[1] !== null));
  const href = (f: Field) => `/taste?${new URLSearchParams({ ghost: ghost.id, field: f, ...(creatorId ? { creator: creatorId } : {}) })}`;

  return (
    <main className="flex min-h-dvh flex-col gap-4 pt-2">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/ghost/${ghost.id}`} className="flex min-h-11 min-w-0 items-center gap-2 text-[13px] font-[560] text-text-dim">
            {/* The ghost is violet: its monogram here, where no AI label would fit beside a face. */}
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-[720] text-white">
              {ghost.name.slice(0, 1)}
            </span>
            <span className="truncate">
              {ghost.name}
              {ghost.niche ? ` · ${nicheIn(ghost, lang)}` : ""}
            </span>
          </Link>
          <nav aria-label={t("fieldLabel", lang)} className="flex shrink-0 gap-1">
            {FIELDS.map((f) => (
              <Link key={f} href={href(f)} aria-current={f === field ? "page" : undefined}
                className={`flex h-9 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-[560] ${f === field ? "bg-text text-bg" : "text-text-dim ring-1 ring-inset ring-line"}`}>
                {t(f === "beauty" ? "fieldBeauty" : "fieldFashion", lang)}
              </Link>
            ))}
          </nav>
        </div>
        <h1 className="text-[26px] font-[720] leading-[1.15] tracking-[-0.02em]">{t("tasteTitle", lang)}</h1>
        <p className="text-[15px] leading-snug text-text-dim">{t("tasteSub", lang)}</p>
        {provenance.source === "fixture" ? (
          <div>
            <DemoTag>
              {t("fixture", lang)} · {shortDate(provenance.readAt, lang)}
            </DemoTag>
          </div>
        ) : null}
      </header>
      <TasteSwipe cards={data.cards} readings={readings} ghostId={ghost.id} creatorId={creatorId} />
      <VerbSpacer />
    </main>
  );
}
