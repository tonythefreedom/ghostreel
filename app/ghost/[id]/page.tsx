// The ghost's channel: who it is, the reels it has finished, and the week ahead as a tape of briefs. Read straight from
// the store on every request; nothing here posts anywhere.
import { notFound } from "next/navigation";
import { ChannelHead } from "@/components/channel/ChannelHead";
import { ReelWall, type Reel } from "@/components/channel/ReelWall";
import { WeekTape } from "@/components/channel/WeekTape";
import { byWritten, week } from "@/components/channel/week";
import { ButtonLink, Empty, Verb, VerbSpacer } from "@/components/ui";
import { getGhost } from "@/lib/newtype";
import { store } from "@/lib/store";
import type { Brief, RenderJob } from "@/lib/types";
import { t } from "@/lib/words";

export const dynamic = "force-dynamic";

async function jobFor(briefId: string): Promise<RenderJob | null> {
  const id = await store.get<string>(`renderFor:${briefId}`);
  return id ? store.get<RenderJob>(`render:${id}`) : null;
}

export default async function GhostChannel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ghost = await getGhost(id);
  if (!ghost) notFound();

  const ids = [...new Set(await store.list(`briefs:${ghost.id}`))];
  const briefs = (await Promise.all(ids.map((b) => store.get<Brief>(`brief:${b}`)))).filter((b): b is Brief => b?.ghostId === ghost.id);
  const jobs = new Map<string, RenderJob>();
  await Promise.all(briefs.map(async (b) => {
    const job = await jobFor(b.id);
    if (job) jobs.set(b.id, job);
  }));

  const { days, later } = week(briefs, jobs, Date.now());
  // Newest first; a failed render leaves the wall (the tape still says so on its day).
  const reels: Reel[] = byWritten(briefs).reverse().flatMap((brief) => {
    const job = jobs.get(brief.id);
    const showable = job && ((job.status === "done" && job.videoUrl) || job.status === "queued" || job.status === "running");
    return showable ? [{ job, brief }] : [];
  });
  const draft = byWritten(briefs).find((b) => b.status === "draft");
  const taste = `/taste?ghost=${ghost.id}`;

  return (
    <main className="flex min-h-dvh flex-col gap-10 py-6">
      <ChannelHead ghost={ghost} />

      <section aria-labelledby="reels" className="flex flex-col gap-3">
        <h2 id="reels" className="text-[18px] font-[720] tracking-[-0.01em]">{t("reels")}</h2>
        {reels.length ? (
          <ReelWall reels={reels} />
        ) : (
          <Empty head={t("noReels")} line={t("noReelsLine")}
            action={<ButtonLink href={taste} kind="secondary" size="m">{t("findShort")}</ButtonLink>} />
        )}
      </section>

      <WeekTape days={days} later={later} ghostId={ghost.id} />

      <VerbSpacer />
      <Verb note={t("noViewsPromise")}>
        <ButtonLink href={draft ? `/brief/${draft.id}` : taste} size="xl">{t(draft ? "approveDraft" : "teachShort")}</ButtonLink>
      </Verb>
    </main>
  );
}
