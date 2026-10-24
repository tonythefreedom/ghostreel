"use client";
// Lane B (gift from Lane A, 10-24). The ghost's reels as 9:16 tiles: poster, state pill, age in mono. A finished
// tile opens the lightbox; tiles still rendering show the slow violet shimmer, never a spinner.
import { useEffect, useState, type ReactNode } from "react";
import type { RenderJob } from "@/lib/types";
import { age } from "./logic";

const STATE = {
  ko: { queued: "대기 중", running: "렌더 중", done: "완료", failed: "실패" },
  en: { queued: "Queued", running: "Rendering", done: "Done", failed: "Failed" },
};
const TONE = { queued: "bg-surface-2 text-text-dim", running: "bg-accent text-text", done: "bg-ghost text-bg", failed: "bg-danger text-bg" };

type Props = { jobs: RenderJob[]; onOpen: (job: RenderJob) => void; empty?: ReactNode; lang?: "ko" | "en" };

export function ReelGrid({ jobs, onOpen, empty, lang = "ko" }: Props) {
  // Ages are drawn after mount so the server and the first client paint agree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (jobs.length === 0) {
    return (
      <div role="status" className="grid min-h-40 place-items-center rounded-[var(--radius-card)] border border-dashed border-line p-6 text-center text-[13px] text-text-dim">
        {empty ?? (lang === "ko" ? "아직 렌더한 숏폼이 없어요. 브리프를 승인하면 여기에 쌓여요." : "No reels yet. Approved briefs land here.")}
      </div>
    );
  }

  return (
    <ul role="list" aria-label={lang === "ko" ? "고스트 숏폼" : "Ghost reels"} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {jobs.map((job) => {
        const done = job.status === "done" && Boolean(job.videoUrl);
        const label = `${STATE[lang][job.status]}${job.provider === "prerender" ? (lang === "ko" ? " · 미리 렌더함" : " · pre-rendered") : ""}`;
        const body = (
          <>
            <span className="relative block aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-card)] bg-surface">
              {job.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.posterUrl} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
              ) : null}
              {job.status === "running" ? <span aria-hidden className="kit-shimmer absolute inset-0 bg-accent/15" /> : null}
              <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[job.status]}`}>
                {STATE[lang][job.status]}
              </span>
              <span className="absolute inset-x-1.5 bottom-1.5 rounded-[6px] bg-bg/80 px-1.5 py-0.5 text-center text-[9px] font-semibold leading-tight text-text">
                AI-generated · Virtual human
              </span>
            </span>
            <span className="flex items-center justify-between px-0.5 pt-1 text-[11px] text-text-dim">
              <span className={job.provider === "prerender" ? "text-warn" : ""}>{job.provider === "prerender" ? "prerender" : "live"}</span>
              <span className="font-mono">{now ? age(job.finishedAt ?? job.startedAt, now, lang) : ""}</span>
            </span>
          </>
        );
        return (
          <li key={job.id} data-status={job.status}>
            {done ? (
              <button type="button" onClick={() => onOpen(job)} aria-label={label}
                className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ghost rounded-[var(--radius-card)]">
                {body}
              </button>
            ) : (
              <div aria-label={label}>{body}</div>
            )}
          </li>
        );
      })}
      <style jsx>{`
        :global(.kit-shimmer) { animation: kit-shimmer 4s ease-in-out infinite; }
        @keyframes kit-shimmer {
          0%, 100% { transform: translateX(-100%); opacity: 0.2; }
          50% { transform: translateX(100%); opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.kit-shimmer) { animation: none; opacity: 0.4; }
        }
      `}</style>
    </ul>
  );
}
