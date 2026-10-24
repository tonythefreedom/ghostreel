"use client";

import { briefCues } from "@/lib/cues";
import { prerenderMatches, type Brief, type RenderJob } from "@/lib/types";
import { Player } from "./ui";
import { DemoTag } from "./TrustLine";
import { useLang } from "@/components/Lang";

// Lane B. A finished render: the shared 9:16 Player (poster first, tap to pause, one voice) with the AI label always on,
// and the pre-render tag when the clip was made ahead of time.
export function ReelPlayer({ job, brief, lang: langProp }: { job: RenderJob; brief?: Brief; lang?: "ko" | "en" }) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const prerender = job.provider === "prerender";
  const mismatch = prerender && (!brief || !prerenderMatches(job, brief));
  return (
    <div className="flex w-full flex-col gap-2">
      <Player
        src={job.videoUrl}
        poster={job.posterUrl}
        marks={prerender ? <DemoTag>{lang === "ko" ? "미리 렌더함" : "pre-rendered"}</DemoTag> : undefined}
        cues={brief && !mismatch ? briefCues(brief, lang) : []}
      />
      {mismatch ? (
        <p className="text-[13px] text-text-3">
          {lang === "ko" ? "이 브리프로 방금 렌더한 영상이 아닙니다" : "Not rendered from this brief"}
        </p>
      ) : null}
    </div>
  );
}
