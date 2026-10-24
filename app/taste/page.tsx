import { notFound } from "next/navigation";
import { TasteSwipe } from "@/components/TasteSwipe";
import { DemoTag } from "@/components/TrustLine";
import { VerbSpacer } from "@/components/ui";
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
    <main className="flex min-h-dvh flex-col gap-5 pt-6">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-[13px] font-[560] text-text-dim">
          {/* The ghost is violet: its monogram stands in for a portrait. */}
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-[720] text-white">
            {ghost.name.slice(0, 1)}
          </span>
          <span>
            {ghost.name}
            {ghost.niche ? ` · ${ghost.niche}` : ""}
          </span>
        </p>
        <h1 className="text-[28px] font-[720] leading-[1.15] tracking-[-0.02em]">{t("tasteTitle")}</h1>
        <p className="text-[15px] text-text-dim">{t("tasteSub")}</p>
        {provenance.source === "fixture" ? (
          <div>
            <DemoTag>
              {t("fixture")} · {shortDate(provenance.readAt)}
            </DemoTag>
          </div>
        ) : null}
      </header>
      <TasteSwipe cards={data.cards} ghostId={ghost.id} creatorId={creatorId} />
      <VerbSpacer />
    </main>
  );
}
