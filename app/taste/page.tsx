import { notFound } from "next/navigation";
import { TasteSwipe } from "@/components/TasteSwipe";
import { DemoTag } from "@/components/TrustLine";
import { getGhost } from "@/lib/newtype";
import { FIELDS, trending, type Field } from "@/lib/shorti";
import { shortDate, t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function TastePage({ searchParams }: { searchParams: Promise<{ ghost?: string; field?: string; creator?: string }> }) {
  const sp = await searchParams;
  const ghost = await getGhost(sp.ghost ?? "yuna");
  if (!ghost) notFound();
  const field: Field = (FIELDS as readonly string[]).includes(sp.field ?? "") ? (sp.field as Field) : "beauty";
  const { data, provenance } = await trending(field);
  const creatorId = /^[0-9a-f-]{36}$/i.test(sp.creator ?? "") ? sp.creator : undefined; // the route checks it is real

  return (
    <main className="flex min-h-dvh flex-col gap-5 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-text">
            {ghost.name.slice(0, 1)}
          </span>
          {ghost.name} · {ghost.niche}
        </div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">{t("tasteTitle")}</h1>
        <p className="text-[15px] text-text-dim">{t("tasteSub")}</p>
        {provenance.source === "fixture" ? (
          <DemoTag>
            {t("fixture")} · {shortDate(provenance.readAt)}
          </DemoTag>
        ) : null}
      </header>
      <TasteSwipe cards={data.cards} ghostId={ghost.id} creatorId={creatorId} />
    </main>
  );
}
