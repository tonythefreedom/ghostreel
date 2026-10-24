"use client";
// Lane B (gift from Lane A, 10-24). One finished reel, full screen: 9:16 frame, play/pause, time in mono, seek, sound,
// then download and copy link. A native <dialog> traps focus, closes on Esc and returns focus to the tile that opened
// it. Starts muted (a phone in a room should not blare), and the AI label stays on the frame the whole time.
import { useEffect, useRef, useState } from "react";
import { prerenderMatches, type Brief, type RenderJob } from "@/lib/types";
import { DemoTag } from "../TrustLine";
import { clock } from "./logic";

type Props = { job: RenderJob | null; brief?: Brief; onClose: () => void; shareUrl?: string; lang?: "ko" | "en" };

const T = {
  ko: { play: "재생", pause: "일시정지", mute: "소리 끄기", unmute: "소리 켜기", seek: "재생 위치", download: "다운로드", copy: "링크 복사", copied: "복사함", close: "닫기", pre: "미리 렌더함", mismatch: "이 브리프로 방금 렌더한 영상이 아닙니다" },
  en: { play: "Play", pause: "Pause", mute: "Mute", unmute: "Unmute", seek: "Position", download: "Download", copy: "Copy link", copied: "Copied", close: "Close", pre: "pre-rendered", mismatch: "Not rendered from this brief" },
};

export function ReelLightbox({ job, brief, onClose, shareUrl, lang = "ko" }: Props) {
  const t = T[lang];
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (job && !d.open) d.showModal();
    if (!job && d.open) d.close();
  }, [job]);

  if (!job?.videoUrl) return <dialog ref={dialog} onClose={onClose} className="hidden" />;
  const prerender = job.provider === "prerender";
  const mismatch = prerender && (!brief || !prerenderMatches(job, brief));

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl ?? job.videoUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the button simply does nothing */ }
  };
  const btn = "grid h-10 min-w-10 place-items-center rounded-full bg-surface-2 px-3 text-[13px] font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ghost";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
      aria-label={lang === "ko" ? "숏폼 보기" : "Reel"}
      className="kit-lightbox m-auto max-h-dvh w-full max-w-[430px] bg-transparent p-4 text-text backdrop:bg-bg/90"
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label={t.close} className={btn}>✕</button>
        </div>
        <div className="relative mx-auto aspect-[9/16] h-[min(70dvh,760px)] max-w-full overflow-hidden rounded-[var(--radius-card)] bg-bg">
          <video
            key={job.id}
            ref={video}
            src={job.videoUrl}
            poster={job.posterUrl}
            autoPlay loop playsInline muted={muted}
            onClick={toggle}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
            className="size-full object-contain"
          />
          <div className="absolute left-2 right-2 top-2 flex flex-wrap items-start gap-2">
            <span className="rounded-full bg-bg px-2 py-1 text-[13px] font-semibold">AI-generated · Virtual human</span>
            {prerender ? <DemoTag>{t.pre}</DemoTag> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle} aria-label={playing ? t.pause : t.play} className={btn}>{playing ? "❚❚" : "▶"}</button>
          <span className="font-mono text-[13px] text-text-dim">{clock(at)} / {clock(length)}</span>
          <input
            type="range" min={0} max={length || 0} step={0.1} value={Math.min(at, length || 0)}
            aria-label={t.seek}
            onChange={(e) => { const v = video.current; if (v) v.currentTime = Number(e.target.value); }}
            className="min-w-0 flex-1 accent-[var(--ghost)]"
          />
          <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? t.unmute : t.mute} aria-pressed={!muted} className={btn}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={job.videoUrl} download className={`${btn} h-12`}>{t.download}</a>
          <button type="button" onClick={copy} className={`${btn} h-12`}>{copied ? t.copied : t.copy}</button>
        </div>
        {mismatch ? <p className="text-[13px] text-text-dim">{t.mismatch}</p> : null}
      </div>
      <style jsx>{`
        .kit-lightbox[open] { animation: kit-in 180ms ease-out; }
        @keyframes kit-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </dialog>
  );
}
