// Lane B (T22). What the creator registered, and their style as Shorti reads it from their own shorts.
import { ButtonLink, Verb, VerbSpacer } from "@/components/ui";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StepStrip } from "@/components/kit";
import { StyleSummary } from "@/components/StyleSummary";
import { CREATOR_FLOW, CREATOR_FLOW_KO, FLOW_STEP, fieldFor } from "@/lib/flow";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/words";
import { creatorKey } from "@/lib/creator";
import { summarize } from "@/lib/creatorStyle";
import { withFace } from "@/lib/ghostFace";
import { getGhost } from "@/lib/newtype";
import { reading, recipeEdit, trending } from "@/lib/shorti";
import { store } from "@/lib/store";
import type { Creator } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const creator = await store.get<Creator>(creatorKey(id));
  if (!creator) notFound();
  const ghost = await getGhost(creator.ghostId);
  const lang = await getLang();
  // Warm the next screen: /taste waits for this week's deck and a reading of each of its first twenty shorts (7 s or
  // more cold, 1 s warm). Started here without waiting, so the 10-minute Shorti cache is full by the time the button
  // is pressed.
  void trending(fieldFor(creator.niche), lang)
    .then(({ data }) => Promise.all(data.cards.slice(0, 20).map((c) => reading(c.videoId, c.url, lang))))
    .catch(() => undefined);
  // Keyless Shorti reads of the creator's own shorts (cached 10 min); a miss just leaves that short out.
  const style = creator.works.length
    ? summarize(await Promise.all(creator.works.map(async (url) => ({
        url,
        reading: await reading(url, url),
        recipe: await recipeEdit(url),
      }))))
    : null;

  return (
    <main className="flex min-h-dvh flex-col gap-10 pt-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-[560] text-text-dim">
          <span className="inline-block size-2 rounded-full bg-accent" aria-hidden />
          {creator.niche} · {creator.market} · {creator.languages.map((l) => l.toUpperCase()).join(" · ")}
        </div>
        <h1 className="text-[28px] font-[720] leading-[1.27] tracking-[-0.02em]">{lang === "ko" ? `${creator.name}의 스타일` : `${creator.name}'s style`}</h1>
        {creator.bio ? <p className="text-[15px] text-text-dim">{creator.bio}</p> : null}
      </header>

      {style ? (
        <StyleSummary style={style} lang={lang} />
      ) : (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong/60 p-5 text-[15px] text-text-dim">
          {t("pfNoShorts", lang)}
        </p>
      )}

      {creator.works.length > 0 ? (
      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] font-[720]">{t("pfYourShorts", lang)}</h2>
        <ul className="flex flex-col gap-1">
          {creator.works.map((url) => (
            <li key={url} className="break-all font-mono text-[12px] text-text-3">
              <a href={url} target="_blank" rel="noreferrer noopener" className="underline decoration-line">{url}</a>
            </li>
          ))}
        </ul>
        {creator.plan || creator.script ? (
          <p className="text-[13px] text-text-dim">
            {t("pfAlso", lang)} {[creator.plan && t("pfPlan", lang), creator.script && t("pfScript", lang)].filter(Boolean).join(", ")}
          </p>
        ) : null}
      </section>
      ) : null}

      {ghost ? (
        <section className="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface p-4">
          {withFace(ghost).portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withFace(ghost).portraitUrl} alt="" className="size-12 shrink-0 rounded-full object-cover object-[50%_18%] ring-2 ring-accent" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-[18px] font-[720] text-accent ring-2 ring-accent">{ghost.name.slice(0, 1)}</span>
          )}
          <div className="flex flex-col">
            <span className="text-[15px] font-[720]">{lang === "ko" ? `${ghost.name}가 대신 출연해요` : `${ghost.name} performs for you`}</span>
            <span className="text-[13px] text-text-3">AI-generated · Virtual human</span>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-[18px] font-[720]">{t("pfNext", lang)}</h2>
        <StepStrip steps={lang === "ko" ? CREATOR_FLOW_KO : CREATOR_FLOW} current={FLOW_STEP.profile} lang={lang} />
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-accent-soft p-4 ring-1 ring-inset ring-accent/30">
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-[720]">{t("landingClaudeH", lang)}</h2>
          <p className="text-[13px] leading-snug text-text-dim">{t("landingClaudeLine", lang)}</p>
        </div>
        <ButtonLink href="/connect" kind="secondary" size="l" className="self-start">{t("navConnect", lang)} →</ButtonLink>
      </section>

      <VerbSpacer />
      <Verb>
        <ButtonLink href={`/taste?ghost=${creator.ghostId}&field=${fieldFor(creator.niche)}&creator=${creator.id}`} size="xl" block>
          {t("pfTune", lang)}
        </ButtonLink>
      </Verb>
    </main>
  );
}
