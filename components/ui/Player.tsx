"use client";
// Shared. DESIGN.md › Layout: a 9:16 reel. The poster stands in until the first frame (never a shimmer); a tap is
// play/pause with ▶ in the middle when paused; sound is off until one tap, and only one reel speaks per page.
// The AI label sits on the picture whenever `ai` is set, which is every ghost reel.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AiLabel } from "./Vellum";

const VOICE = "gr-voice"; // one voice per page: a reel that unmutes tells the others to hush

type Props = {
  src?: string;
  poster?: string;
  ai?: boolean;
  /** "card" plays muted in a grid; "page" is a reel with its keys; "stage" fills its box edge to edge. */
  mode?: "card" | "page" | "stage";
  autoPlay?: boolean;
  label?: string;
  onEnded?: () => void;
  /** Extra marks drawn on the picture (a demo tag, a state pill), top left under the AI label. */
  marks?: ReactNode;
  className?: string;
};

export function Player({ src, poster, ai = true, mode = "page", autoPlay = true, label, onEnded, marks, className = "" }: Props) {
  const id = useId();
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(!autoPlay);
  const [byHand, setByHand] = useState(false); // ▶ shows only when a person paused it
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hush = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setMuted(true);
    };
    window.addEventListener(VOICE, hush);
    return () => window.removeEventListener(VOICE, hush);
  }, [id]);

  const toggle = () => {
    const v = video.current;
    if (!v || !src || failed) return;
    if (v.paused) {
      void v.play();
      setByHand(false);
    } else {
      v.pause();
      setByHand(true);
    }
  };
  const sound = () => {
    const next = !muted;
    setMuted(next);
    if (!next) window.dispatchEvent(new CustomEvent(VOICE, { detail: id }));
  };

  const radius = mode === "stage" ? "" : "rounded-[var(--radius-pic)]";
  return (
    <div
      className={`relative isolate aspect-[9/16] w-full overflow-hidden bg-surface-2 bg-cover bg-center ${radius} ${className}`}
      style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
      aria-label={label}
    >
      {src && !failed ? (
        <video
          ref={video}
          src={src}
          poster={poster}
          muted={muted}
          autoPlay={autoPlay}
          loop={!onEnded}
          playsInline
          preload="metadata"
          onClick={toggle}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onEnded={onEnded}
          onError={() => setFailed(true)}
          className="size-full cursor-pointer object-cover"
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-2">
        <div className="flex flex-col items-start gap-1.5">
          {ai ? <AiLabel /> : null}
          {marks}
        </div>
        {src && !failed && mode !== "card" ? (
          <button
            type="button"
            onClick={sound}
            aria-label={muted ? "Sound on" : "Sound off"}
            className="pointer-events-auto -m-2 grid size-11 place-items-center text-[16px] text-text [filter:drop-shadow(0_1px_2px_rgba(10,10,10,.72))_drop-shadow(0_0_8px_rgba(10,10,10,.4))]"
          >
            <SoundGlyph on={!muted} />
          </button>
        ) : null}
      </div>

      {paused && byHand ? (
        <span aria-hidden className="vellum pointer-events-none absolute left-1/2 top-1/2 z-[5] grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full pl-1 text-[26px]">
          ▶
        </span>
      ) : null}
    </div>
  );
}

function SoundGlyph({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M16 9l5 6M21 9l-5 6" />}
    </svg>
  );
}
