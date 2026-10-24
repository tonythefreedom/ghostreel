"use client";

import { useEffect, useState } from "react";
import type { Brief, RenderJob as RenderJobData } from "@/lib/types";
import { Progress, type Step } from "./ui";
import { ReelPlayer } from "./ReelPlayer";
import { useLang } from "@/components/Lang";

// Lane B. A render as its steps (✓ approved · ● rendering · ○ ready) with the elapsed time beside the step that is
// running, the ghost's poster standing in until the reel is ready. Never a spinner or a shimmer.
const words = {
  ko: { approved: "브리프 승인", queued: "렌더 대기", running: "고스트가 촬영 중", ready: "숏폼 완성", failed: "렌더 실패" },
  en: { approved: "Brief approved", queued: "Waiting for the renderer", running: "Your ghost is filming", ready: "Reel ready", failed: "Render failed" },
};

export function RenderJob({ job, brief, lang: langProp }: { job: RenderJobData; brief?: Brief; lang?: "ko" | "en" }) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const w = words[lang];
  const [now, setNow] = useState<number | null>(null);
  const active = job.status === "queued" || job.status === "running";
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, job.id]);
  const start = Date.parse(job.startedAt);
  // Instant pre-render jobs may have no finishedAt from the route; never keep counting a completed job.
  const end = job.finishedAt ? Date.parse(job.finishedAt) : active ? now ?? start : start;
  const elapsed = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.floor((end - start) / 1000)) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  const steps: Step[] = [
    { label: w.approved, state: "done" },
    job.status === "queued"
      ? { label: w.queued, state: "now", figure: clock }
      : { label: w.running, state: job.status === "running" ? "now" : job.status === "failed" ? "now" : "done", figure: job.status === "running" ? clock : undefined },
    { label: job.status === "failed" ? w.failed : w.ready, state: job.status === "done" ? "done" : "next", figure: job.status === "done" ? clock : undefined },
  ];

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[12px] font-[560] ${job.provider === "prerender" ? "bg-warn/15 text-warn" : "bg-accent-soft text-accent"}`}>
          {job.provider === "prerender" ? "prerender" : "live"}
        </span>
      </div>
      <Progress steps={steps} label={lang === "ko" ? "렌더 진행" : "Render progress"} />
      {job.status === "failed" ? <p role="alert" className="text-[13px] text-danger">✕ {job.error ?? w.failed}</p> : null}
      {job.status === "done" ? (
        <ReelPlayer job={job} brief={brief} lang={lang} />
      ) : active && job.posterUrl ? (
        // The ghost's own still while it films: a poster, not a placeholder animation.
        <div aria-hidden className="aspect-[9/16] w-full rounded-[var(--radius-pic)] bg-surface-2 bg-cover bg-center opacity-60" style={{ backgroundImage: `url("${job.posterUrl}")` }} />
      ) : null}
    </section>
  );
}
