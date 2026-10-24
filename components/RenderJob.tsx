"use client";

import { useEffect, useState } from "react";
import type { Brief, RenderJob as RenderJobData } from "@/lib/types";
import { ReelPlayer } from "./ReelPlayer";

const states = {
  ko: { queued: "대기 중", running: "렌더 중", done: "완료", failed: "실패" },
  en: { queued: "Queued", running: "Running", done: "Done", failed: "Failed" },
};

export function RenderJob({ job, brief, lang = "ko" }: { job: RenderJobData; brief?: Brief; lang?: "ko" | "en" }) {
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

  return (
    <section className="flex w-full flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className={`text-[15px] font-semibold ${job.status === "failed" ? "text-danger" : "text-ghost"}`}>
          {states[lang][job.status]}
        </p>
        <span className={`rounded-full px-2 py-1 text-[13px] ${job.provider === "prerender" ? "bg-warn/15 text-warn" : "bg-accent/15 text-accent"}`}>
          {job.provider === "prerender" ? "prerender" : "live"}
        </span>
        <span className="font-mono text-[13px] text-text-dim" aria-label={lang === "ko" ? "경과 시간" : "Elapsed time"}>
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>
      {active ? (
        <div aria-hidden="true" className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-card)] bg-bg">
          {job.status === "running" ? <div className="shimmer absolute inset-0 bg-accent/15" /> : null}
        </div>
      ) : null}
      {job.status === "failed" ? <p className="text-[13px] text-danger">{job.error ?? states[lang].failed}</p> : null}
      {job.status === "done" ? <ReelPlayer job={job} brief={brief} lang={lang} /> : null}
      <style jsx>{`
        .shimmer { animation: shimmer 4s ease-in-out infinite; }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); opacity: 0.2; }
          50% { transform: translateX(100%); opacity: 0.7; }
        }
        @keyframes fade { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.6; } }
        @media (prefers-reduced-motion: reduce) {
          .shimmer { animation: fade 4s ease-in-out infinite; animation-duration: 4s !important; transform: none; }
        }
      `}</style>
    </section>
  );
}
