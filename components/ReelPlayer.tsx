"use client";

import { prerenderMatches, type Brief, type RenderJob } from "@/lib/types";
import { DemoTag } from "./TrustLine";

export function ReelPlayer({ job, brief, lang = "en" }: { job: RenderJob; brief?: Brief; lang?: "ko" | "en" }) {
  const prerender = job.provider === "prerender";
  const mismatch = prerender && (!brief || !prerenderMatches(job, brief));
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative aspect-[9/16] w-full rounded-[var(--radius-card)] bg-bg">
        <video
          src={job.videoUrl}
          poster={job.posterUrl}
          muted autoPlay loop playsInline
          className="h-full w-full rounded-[var(--radius-card)] object-contain"
        />
        <div className="absolute left-2 right-2 top-2 z-10 flex flex-wrap items-start gap-2">
          <span className="rounded-full bg-bg px-2 py-1 text-[13px] font-semibold text-text">
            AI-generated · Virtual human
          </span>
          {prerender ? <DemoTag>{lang === "ko" ? "미리 렌더함" : "pre-rendered"}</DemoTag> : null}
        </div>
      </div>
      {mismatch ? (
        <p className="text-[13px] text-text-dim">
          {lang === "ko" ? "이 brief 로 방금 렌더한 영상이 아닙니다" : "Not rendered from this brief"}
        </p>
      ) : null}
    </div>
  );
}
