// Lane B (T22). What the creator registered, and their style as Shorti reads it from their own shorts.
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StepStrip } from "@/components/kit";
import { StyleSummary } from "@/components/StyleSummary";
import { CREATOR_FLOW, FLOW_STEP, fieldFor } from "@/lib/flow";
import { creatorKey } from "@/lib/creator";
import { summarize } from "@/lib/creatorStyle";
import { getGhost } from "@/lib/newtype";
import { reading, recipeEdit } from "@/lib/shorti";
import { store } from "@/lib/store";
import type { Creator } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const creator = await store.get<Creator>(creatorKey(id));
  if (!creator) notFound();
  const ghost = await getGhost(creator.ghostId);
  // Keyless Shorti reads of the creator's own shorts (cached 10 min); a miss just leaves that short out.
  const style = creator.works.length
    ? summarize(await Promise.all(creator.works.map(async (url) => ({
        url,
        reading: await reading(url, url),
        recipe: await recipeEdit(url),
      }))))
    : null;

  return (
    <main className="flex min-h-dvh flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="inline-block size-2 rounded-full bg-ghost" aria-hidden />
          {creator.niche} · {creator.market} · {creator.languages.map((l) => l.toUpperCase()).join(" · ")}
        </div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">{creator.name}'s style</h1>
        {creator.bio ? <p className="text-[15px] text-text-dim">{creator.bio}</p> : null}
      </header>

      {style ? (
        <StyleSummary style={style} />
      ) : (
        <p className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[13px] text-text-dim">
          No shorts of your own yet? That's fine. Next, you'll pick shorts trending abroad to teach your ghost.
        </p>
      )}

      {creator.works.length > 0 ? (
      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-extrabold">Your shorts</h2>
        <ul className="flex flex-col gap-1">
          {creator.works.map((url) => (
            <li key={url} className="truncate font-mono text-[12px] text-text-dim">
              <a href={url} target="_blank" rel="noreferrer noopener" className="underline decoration-line">{url}</a>
            </li>
          ))}
        </ul>
        {creator.plan || creator.script ? (
          <p className="text-[13px] text-text-dim">
            Also shared: {[creator.plan && "a plan", creator.script && "a script"].filter(Boolean).join(", ")}
          </p>
        ) : null}
      </section>
      ) : null}

      {ghost ? (
        <section className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-[18px] font-extrabold">{ghost.name.slice(0, 1)}</span>
          <div className="flex flex-col">
            <span className="text-[15px] font-extrabold">{ghost.name} performs for you</span>
            <span className="text-[12px] text-text-dim">AI-generated · Virtual human</span>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-extrabold">What happens next</h2>
        <StepStrip steps={CREATOR_FLOW} current={FLOW_STEP.profile} />
      </section>

      <Link href={`/taste?ghost=${creator.ghostId}&field=${fieldFor(creator.niche)}&creator=${creator.id}`}
        className="grid h-14 w-full place-items-center rounded-[var(--radius-card)] bg-ghost text-[15px] font-extrabold text-bg">
        Tune it to this week's trends
      </Link>
    </main>
  );
}
