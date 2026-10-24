"use client";
// After approval: the render as its steps (✓ written · ● the stage now · ○ ready), a bar with the share done and the
// estimated finish, the opening frame while it waits and the reel once it is done. The render runs on the server, so a
// reload shows the bar where it stands. Never a spinner or a shimmer (DESIGN.md › Motion on screens).
import { useEffect, useState } from "react";
import { clock } from "@/components/kit/logic";
import { DemoTag } from "@/components/TrustLine";
import { Player, Progress, type Step } from "@/components/ui";
import { briefCues } from "@/lib/cues";
import { prerenderMatches, type Brief, type RenderJob } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";

const JOB_WORD: Record<RenderJob["status"], WordKey> = {
  queued: "renderQueued",
  running: "renderRunning",
  done: "renderDone",
  failed: "renderFailed",
};
const STAGE_WORD: Record<NonNullable<RenderJob["stage"]>, WordKey> = {
  keyframe: "stageKeyframe",
  voice: "stageVoice",
  lipsync: "stageLipsync",
  assemble: "stageAssemble",
};
const NOTICE_WORD: Record<string, WordKey> = {
  lipsync_unavailable: "lipsyncUnavailable",
  lipsync_failed: "lipsyncFailed",
  lipsync_lost: "lipsyncLost",
};

export function RenderState({ job, brief, poster, fallback, lang }: {
  job: RenderJob;
  brief: Brief;
  poster?: string;
  /** The pre-rendered clip to show, labelled, when a live render fails. */
  fallback?: { src: string; poster?: string };
  lang: UiLang;
}) {
  const active = job.status === "queued" || job.status === "running";
  // The clock is read after mount so the server and the first client paint agree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, job.id]);

  const start = Date.parse(job.startedAt);
  const end = job.finishedAt ? Date.parse(job.finishedAt) : active ? (now ?? start) : start;
  const elapsed = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, (end - start) / 1000) : null;
  const done = job.status === "done";
  const prerender = job.provider === "prerender";
  const live = job.provider === "newtype";

  const stageLabel = active && job.stage ? t(STAGE_WORD[job.stage], lang) : t(JOB_WORD[job.status], lang);
  const clipFigure = active && job.stage === "lipsync" && job.clip && job.clips ? `${job.clip}/${job.clips}` : null;
  const steps: Step[] = [
    { label: t("stepWritten", lang), state: "done" },
    {
      label: clipFigure ? `${stageLabel} ${clipFigure}` : stageLabel,
      state: done ? "done" : "now",
      figure: elapsed != null ? clock(elapsed) : undefined,
    },
    { label: t("stepReady", lang), state: done ? "done" : "next" },
  ];
  const picture = done && job.videoUrl ? job.posterUrl : (job.posterUrl ?? poster);
  const pct = Math.round((job.progress ?? 0) * 100);
  const eta = active && job.etaAt && now != null
    ? new Date(Math.max(now, Date.parse(job.etaAt))).toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;
  const notSynced = live && job.lipSync === false;
  const notice = job.notice ? NOTICE_WORD[job.notice] : undefined;

  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <Progress steps={steps} label={t("renderRunning", lang)} />
      {active && live ? (
        <div className="flex flex-col gap-1.5">
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={stageLabel}
            className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-mono text-text-dim">{pct}%</span>
            {eta ? <span className="text-text-dim">{t("etaAt", lang)} <span className="font-mono text-text">{eta}</span></span> : null}
          </div>
          {job.stage === "lipsync" || job.lipSync ? <p className="text-[12px] leading-snug text-text-3">{t("renderLongNote", lang)}</p> : null}
        </div>
      ) : null}
      {notice ? <p className="text-[13px] leading-snug text-warn">{t(notice, lang)}</p> : null}
      {job.status === "failed" ? (
        <p role="alert" className="text-[13px] text-danger">
          ✕ {t("renderFailed", lang)}
          {job.error ? ` · ${job.error}` : ""}
        </p>
      ) : null}
      {done && job.videoUrl ? (
        <Player src={job.videoUrl} poster={picture} label={t("aiLabel", lang)}
          marks={prerender ? <DemoTag>{t("prerendered", lang)}</DemoTag> : notSynced ? <DemoTag>{t("notLipSynced", lang)}</DemoTag> : undefined}
          cues={!prerender || prerenderMatches(job, brief) ? briefCues(brief) : []} />
      ) : active && picture ? (
        <Player poster={picture} autoPlay={false} label={t("aiLabel", lang)} />
      ) : job.status === "failed" && fallback ? (
        <div className="flex flex-col gap-2">
          <Player src={fallback.src} poster={fallback.poster} label={t("aiLabel", lang)} marks={<DemoTag>{t("prerendered", lang)}</DemoTag>} />
          <p className="text-[13px] text-text-3">{t("fallbackClip", lang)}</p>
        </div>
      ) : null}
      {done && prerender && !prerenderMatches(job, brief) ? (
        <p className="text-[13px] text-text-3">
          {t("prerendered", lang)} · {t("prerenderOther", lang)}
        </p>
      ) : null}
    </section>
  );
}
