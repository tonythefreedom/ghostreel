"use client";
// Lane B (gift from Lane A, 10-24). One finished reel, full screen: the shared Player with the same keys as every video
// (play, sound, the coaching pencil writing the brief's beats), its scrub line, then download and copy link. A native
// <dialog> traps focus, closes on Esc and returns focus to the tile that opened it. Starts muted (a phone in a room
// should not blare), and the AI label stays on the frame the whole time.
import { useEffect, useRef, useState } from "react";
import { briefCues } from "@/lib/cues";
import { prerenderMatches, type Brief, type RenderJob } from "@/lib/types";
import { useT } from "@/components/Lang";
import { DemoTag } from "../TrustLine";
import { Player } from "../ui";

type Props = { job: RenderJob | null; brief?: Brief; onClose: () => void; shareUrl?: string; lang?: "ko" | "en" };

export function ReelLightbox({ job, brief, onClose, shareUrl }: Props) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (job && !d.open) d.showModal();
    if (!job && d.open) d.close();
  }, [job]);

  if (!job?.videoUrl) return <dialog ref={dialog} onClose={onClose} className="hidden" />;
  const prerender = job.provider === "prerender";
  const matches = Boolean(brief) && (!prerender || prerenderMatches(job, brief!));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl ?? new URL(job.videoUrl!, location.href).href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the button simply does nothing */ }
  };
  const btn = "grid h-12 place-items-center rounded-[var(--radius-control)] bg-surface-2 px-3 text-[13px] font-[640] text-text ring-1 ring-inset ring-line hover:bg-pressed";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
      aria-label={t("reelOf")}
      className="kit-lightbox m-auto max-h-dvh w-full max-w-[430px] bg-transparent p-4 text-text backdrop:bg-bg/90"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="min-w-0 truncate text-[15px] font-[720]">{brief?.hook}</p>
          <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label={t("close")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-[15px]">✕</button>
        </div>
        <div className="mx-auto w-full max-w-[calc(68dvh*9/16)]">
          <Player
            key={job.id}
            src={job.videoUrl}
            poster={job.posterUrl}
            label={brief?.hook}
            marks={prerender ? <DemoTag>{t("prerendered")}</DemoTag> : undefined}
            // The brief's beats are drawn only over a reel rendered from this very brief.
            cues={matches ? briefCues(brief) : []}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={job.videoUrl} download className={btn}>{t("download")}</a>
          <button type="button" onClick={copy} className={btn}>{copied ? `✓ ${t("copied")}` : t("copyLink")}</button>
        </div>
        {prerender && !matches ? <p className="text-[13px] text-text-3">{t("prerenderOther")}</p> : null}
      </div>
      <style jsx>{`
        .kit-lightbox[open] { animation: kit-in 180ms ease-out; }
        @keyframes kit-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </dialog>
  );
}
