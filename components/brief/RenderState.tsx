"use client";
// After approval: the render as its steps (✓ written · ● rendering · ○ ready), the ghost's poster while it waits and the
// reel once it is done. Never a spinner or a shimmer (DESIGN.md › Motion on screens).
import { useEffect, useState } from "react";
import { clock } from "@/components/kit/logic";
import { DemoTag } from "@/components/TrustLine";
import { Player, Progress, type Step } from "@/components/ui";
import { prerenderMatches, type Brief, type RenderJob } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";

const JOB_WORD: Record<RenderJob["status"], WordKey> = {
  queued: "renderQueued",
  running: "renderRunning",
  done: "renderDone",
  failed: "renderFailed",
};

export function RenderState({ job, brief, poster, lang }: { job: RenderJob; brief: Brief; poster?: string; lang: UiLang }) {
  const active = job.status === "queued" || job.status === "running";
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, job.id]);

  const start = Date.parse(job.startedAt);
  const end = job.finishedAt ? Date.parse(job.finishedAt) : active ? (now ?? start) : start;
  const elapsed = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, (end - start) / 1000) : null;
  const done = job.status === "done";
  const prerender = job.provider === "prerender";

  const steps: Step[] = [
    { label: t("stepWritten", lang), state: "done" },
    { label: t(JOB_WORD[job.status], lang), state: done ? "done" : "now", figure: elapsed != null ? clock(elapsed) : undefined },
    { label: t("stepReady", lang), state: done ? "done" : "next" },
  ];
  const picture = done && job.videoUrl ? job.posterUrl : (job.posterUrl ?? poster);

  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <Progress steps={steps} label={t("renderRunning", lang)} />
      {job.status === "failed" ? (
        <p role="alert" className="text-[13px] text-danger">
          ✕ {t("renderFailed", lang)}
          {job.error ? ` · ${job.error}` : ""}
        </p>
      ) : null}
      {done && job.videoUrl ? (
        <Player src={job.videoUrl} poster={picture} label={t("aiLabel", lang)} marks={prerender ? <DemoTag>{t("prerendered", lang)}</DemoTag> : undefined} />
      ) : active && picture ? (
        <Player poster={picture} autoPlay={false} label={t("aiLabel", lang)} />
      ) : null}
      {done && prerender && !prerenderMatches(job, brief) ? (
        <p className="text-[13px] text-text-3">
          {t("prerendered", lang)} · {t("prerenderOther", lang)}
        </p>
      ) : null}
    </section>
  );
}
