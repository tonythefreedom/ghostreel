"use client";
// Lane A. The ghost's reels, two to a row: a finished reel plays muted in card mode and a tap opens it full screen;
// one still rendering shows its poster and a state word, never a spinner or shimmer. AI label on every picture.
import { useState } from "react";
import { ReelLightbox } from "@/components/kit";
import { Player } from "@/components/ui";
import type { Brief, RenderJob } from "@/lib/types";
import { useT } from "@/components/Lang";

export type Reel = { job: RenderJob; brief: Brief };

const pill = "vellum inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-[560]";

export function ReelWall({ reels }: { reels: Reel[] }) {
  const t = useT();
  const [open, setOpen] = useState<Reel | null>(null);
  return (
    <>
      <ul role="list" aria-label={t("reels")} className="grid grid-cols-2 gap-3">
        {reels.map((r) => {
          const done = r.job.status === "done" && Boolean(r.job.videoUrl);
          // The demo notice sits on Vellum like every word over a picture, in its gold.
          const pre = r.job.provider === "prerender" ? <span className={`${pill} text-warn`}>{t("prerendered")}</span> : null;
          return (
            <li key={r.job.id} className="flex flex-col gap-2">
              <div className="relative">
                {done ? (
                  <>
                    <Player src={r.job.videoUrl} poster={r.job.posterUrl} mode="card" label={r.brief.hook} marks={pre} />
                    <button type="button" onClick={() => setOpen(r)} aria-label={`${t("reelOf")}: ${r.brief.hook}`}
                      className="absolute inset-0 z-[4] rounded-[var(--radius-pic)]" />
                  </>
                ) : (
                  <Player poster={r.job.posterUrl} mode="card" label={r.brief.hook}
                    marks={<>
                      <span className={`${pill} text-accent`}>{t(r.job.status === "running" ? "renderRunning" : "renderQueued")}</span>
                      {pre}
                    </>} />
                )}
              </div>
              <p className="text-[13px] text-text-dim">{r.brief.hook}</p>
            </li>
          );
        })}
      </ul>
      <ReelLightbox job={open?.job ?? null} brief={open?.brief} onClose={() => setOpen(null)} />
    </>
  );
}
