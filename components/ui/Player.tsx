"use client";
// Shared. DESIGN.md › Layout: a 9:16 reel. The poster stands in until the first frame (never a shimmer). Every video
// wears the same keys in the same place, top right: play, sound, and the coaching pencil when it has cues. Sound is
// off until a tap, and only one reel speaks per page. The AI label sits top left whenever `ai` is set (every ghost reel).
//
// The pencil: each cue is a moment of the clip with its words (Shorti's cues for a hit, the brief's beats for a ghost
// reel). As the clip reaches one, it stands still on that frame while the pencil writes the cue over the picture,
// underlines it and rings what to look at, then runs on. "Next" takes the clip to the next cue. A scrub line at the
// foot shows the clip's measured cuts and its cues, and seeks under a finger.
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { useT } from "../Lang";
import { clock } from "../kit/logic";
import { ring, underline } from "./pencil";
import { AiLabel } from "./Vellum";

const VOICE = "gr-voice"; // one voice per page: a reel that unmutes tells the others to hush
const HOLD_MS = 1700; // how long the clip stands on a cue's frame while the pencil writes
const SHOW_S = 2.8; // how long a cue's words stay once the clip runs on (or until the next cue)

export type Cue = {
  /** seconds on the clip's clock */
  t: number;
  /** the craft point, short: «Look up while applying» */
  title: string;
  /** what to do, one or two lines */
  line?: string;
  /** what to look at in the frame, each ringed */
  tags?: string[];
};

type Props = {
  src?: string;
  poster?: string;
  ai?: boolean;
  /** "card" plays muted in a grid; "page" is a reel with its keys and scrub; "stage" fills its box edge to edge. */
  mode?: "card" | "page" | "stage";
  autoPlay?: boolean;
  label?: string;
  onEnded?: () => void;
  /** Extra marks drawn on the picture (a demo tag, a state pill), top left under the AI label. */
  marks?: ReactNode;
  className?: string;
  /** the coaching pencil's moments; none, no pencil key */
  cues?: readonly Cue[];
  /** measured cuts (s), ticked on the scrub line */
  cuts?: readonly number[];
  /** the pencil is on from the start (default); false waits for its key */
  coachFirst?: boolean;
  /** stand on each cue's frame while it is written (default) */
  hold?: boolean;
};

export function Player({
  src, poster, ai = true, mode = "page", autoPlay = true, label, onEnded, marks, className = "",
  cues = [], cuts = [], coachFirst = true, hold = true,
}: Props) {
  const t = useT();
  const id = useId();
  const video = useRef<HTMLVideoElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [byHand, setByHand] = useState(false); // a person paused it: ▶ in the middle
  const [failed, setFailed] = useState(false);
  const [coach, setCoach] = useState(coachFirst && cues.length > 0);
  const [shown, setShown] = useState(-1); // the cue being written, or none
  const [duration, setDuration] = useState(0);
  const holding = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHeld = useRef(-1);
  const byHandRef = useRef(false);
  const live = Boolean(src) && !failed;
  const sorted = useRef(cues);
  sorted.current = cues;
  const coachOn = useRef(coach);
  coachOn.current = coach;

  // One voice per page.
  useEffect(() => {
    const hush = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setMuted(true);
    };
    window.addEventListener(VOICE, hush);
    return () => window.removeEventListener(VOICE, hush);
  }, [id]);

  const endHold = useCallback(() => {
    if (holding.current) clearTimeout(holding.current);
    holding.current = null;
  }, []);

  // The clock: every frame while mounted, the scrub's fill, which cue is written, and the stand on a cue's frame.
  useEffect(() => {
    const v = video.current;
    if (!v || !live) return;
    let raf = 0;
    let prev = 0;
    const tick = () => {
      const now = v.currentTime;
      const d = v.duration;
      if (fill.current && Number.isFinite(d) && d > 0) fill.current.style.transform = `scaleX(${Math.min(1, now / d)})`;
      if (now < prev - 0.5) lastHeld.current = -1; // it went round
      prev = now;
      const list = sorted.current;
      let at = -1;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i]!.t <= now + 0.04) { at = i; break; }
      }
      const next = list[at + 1]?.t ?? Infinity;
      const here = list[at];
      const showing = here && now < Math.min(next, here.t + SHOW_S) ? at : -1;
      setShown((s) => (s === showing ? s : showing));
      if (coachOn.current && hold && here && at !== lastHeld.current && now - here.t < 0.4 && !v.paused && !byHandRef.current) {
        lastHeld.current = at;
        v.pause();
        endHold();
        holding.current = setTimeout(() => {
          holding.current = null;
          if (!byHandRef.current) void v.play().catch(() => {});
        }, reduced() ? HOLD_MS / 2 : HOLD_MS);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const seeked = () => {
      const now = v.currentTime;
      const list = sorted.current;
      let before = -1;
      for (let i = list.length - 1; i >= 0; i--) if (list[i]!.t < now - 0.01) { before = i; break; }
      lastHeld.current = before;
    };
    v.addEventListener("seeked", seeked);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("seeked", seeked);
      endHold();
    };
  }, [live, hold, endHold]);

  const play = () => {
    const v = video.current;
    if (!v || !live) return;
    endHold();
    if (v.paused) {
      byHandRef.current = false;
      setByHand(false);
      void v.play().catch(() => {});
    } else {
      byHandRef.current = true;
      setByHand(true);
      v.pause();
    }
  };
  const voiceOn = () => {
    setMuted(false);
    if (video.current) video.current.muted = false;
    window.dispatchEvent(new CustomEvent(VOICE, { detail: id }));
  };
  const sound = () => {
    if (muted) voiceOn();
    else setMuted(true);
  };
  const pencil = () => {
    const on = !coach;
    setCoach(on);
    if (on) {
      // A hand that turns the pencil on is listening: the clip plays aloud, from the cue it stands nearest.
      if (muted) voiceOn();
      const v = video.current;
      if (v && v.paused && !byHandRef.current) void v.play().catch(() => {});
    } else {
      endHold();
      const v = video.current;
      if (v && v.paused && !byHandRef.current) void v.play().catch(() => {});
    }
  };
  const seekTo = (s: number) => {
    const v = video.current;
    if (!v) return;
    endHold();
    v.currentTime = Math.max(0, s);
    if (v.paused && !byHandRef.current) void v.play().catch(() => {});
  };
  const nextCue = () => {
    const v = video.current;
    if (!v) return;
    const n = cues.find((c) => c.t > v.currentTime + 0.1);
    if (n) seekTo(n.t);
    else seekTo(cues[0]?.t ?? 0);
  };

  const radius = mode === "stage" ? "" : "rounded-[var(--radius-pic)]";
  const keyed = live;
  const showScrub = live && mode !== "card";
  const cue = coach && shown >= 0 ? cues[shown] : null;

  return (
    <div
      className={`@container relative isolate aspect-[9/16] w-full overflow-hidden bg-surface-2 bg-cover bg-center ${radius} ${className}`}
      style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
      aria-label={label}
      role={label ? "group" : undefined}
    >
      {live ? (
        <video
          ref={video}
          src={src}
          poster={poster}
          muted={muted}
          autoPlay={autoPlay}
          loop={!onEnded}
          playsInline
          preload="metadata"
          onClick={play}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={onEnded}
          onError={() => setFailed(true)}
          className="size-full cursor-pointer object-cover"
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          {ai ? <AiLabel /> : null}
          {marks}
        </div>
        {keyed ? (
          <div className={`pointer-events-auto -mr-1 -mt-1 shrink-0 items-center ${mode === "card" ? "hidden @[220px]:flex" : "flex"}`}>
            <Key label={playing ? t("pause") : t("play")} onClick={play}>
              <Glyph name={playing ? "pause" : "play"} />
            </Key>
            <Key label={muted ? t("soundOn") : t("soundOff")} on={!muted} onClick={sound}>
              <Glyph name={muted ? "muted" : "sound"} />
            </Key>
            {cues.length ? (
              <Key label={coach ? t("coachOff") : t("coachOn")} on={coach} ink onClick={pencil}>
                <Glyph name="pencil" />
              </Key>
            ) : null}
          </div>
        ) : null}
      </div>

      {byHand && !playing ? (
        <span aria-hidden className="vellum pointer-events-none absolute left-1/2 top-1/2 z-[5] grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full pl-1 text-[24px]">
          ▶
        </span>
      ) : null}

      {cue ? <CueCard key={shown} cue={cue} small={mode === "card"} hasNext={cues.length > 1} onNext={nextCue} raised={showScrub} /> : null}

      {showScrub ? <Scrub fill={fill} duration={duration} cuts={cuts} cues={coach ? cues : []} onSeek={seekTo} label={t("seek")} /> : null}
    </div>
  );
}

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A key on the picture: a bare glyph that carries itself over any frame; "on" is a short line under it. */
function Key({ label, on, ink, onClick, children }: { label: string; on?: boolean; ink?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className="relative grid size-11 place-items-center text-text [filter:drop-shadow(0_1px_2px_rgba(10,10,10,.8))_drop-shadow(0_0_8px_rgba(10,10,10,.45))]"
    >
      {children}
      <span
        aria-hidden
        className={`absolute bottom-1.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full transition-[opacity,transform] duration-[125ms] ${
          on ? `scale-x-100 opacity-100 ${ink ? "bg-pencil" : "bg-text"}` : "scale-x-0 opacity-0"
        }`}
      />
    </button>
  );
}

function Glyph({ name }: { name: "play" | "pause" | "sound" | "muted" | "pencil" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
  switch (name) {
    case "play":
      return <svg {...common}><path d="M7 5.5v13l11-6.5z" fill="currentColor" /></svg>;
    case "pause":
      return <svg {...common}><path d="M8 5v14M16 5v14" strokeWidth={2.6} /></svg>;
    case "sound":
      return <svg {...common}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>;
    case "muted":
      return <svg {...common}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 9l5 6M21 9l-5 6" /></svg>;
    case "pencil":
      return <svg {...common}><path d="M14.5 5.5l4 4L8 20H4v-4z" /><path d="M12.5 7.5l4 4" /></svg>;
  }
}

/** The cue as the pencil writes it: the instant and the craft point, underlined; what to do; what to look at, ringed. */
function CueCard({ cue, small, hasNext, onNext, raised }: { cue: Cue; small: boolean; hasNext: boolean; onNext: () => void; raised: boolean }) {
  const t = useT();
  const title = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    setW(Math.round(title.current?.getBoundingClientRect().width ?? 0));
  }, [cue.title]);
  const tags = (cue.tags ?? []).slice(0, 3);
  return (
    <div
      className={`gr-cue pointer-events-none absolute inset-x-2 z-[7] flex flex-col ${raised ? "bottom-9" : "bottom-2"}`}
      aria-live="polite"
    >
      {tags.length && !small ? (
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-2 px-1">
          {tags.map((tag, i) => (
            <RingedTag key={tag} text={tag} delay={420 + i * 160} />
          ))}
        </div>
      ) : null}
      <div className="vellum pointer-events-auto flex items-start gap-1 rounded-[var(--radius-card)] py-2.5 pl-3 pr-1 @[300px]:gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="shrink-0 whitespace-nowrap font-mono text-[12px] font-[640] text-pencil">{clock(cue.t)}</span>
            <span ref={title} className={`relative font-[720] leading-snug tracking-[-0.01em] ${small ? "text-[13px]" : "text-[14px] @[300px]:text-[15px]"}`}>
              {cue.title}
              {w > 0 ? (
                <svg aria-hidden className="pointer-events-none absolute -bottom-2 left-0 overflow-visible" width={w} height={10} viewBox={`0 0 ${w} 10`}>
                  <path d={underline(w, 10, cue.title)} pathLength={1} className="gr-stroke" stroke="var(--pencil)" strokeWidth={2.2} fill="none" strokeLinecap="round" />
                </svg>
              ) : null}
            </span>
          </p>
          {cue.line && !small ? <p className="gr-cue-line mt-2 line-clamp-2 text-[12px] leading-snug text-text-dim @[300px]:text-[13px]">{cue.line}</p> : null}
        </div>
        {hasNext && !small ? (
          <button type="button" data-no-drag onClick={onNext} className="-my-1 flex h-11 shrink-0 items-center gap-0.5 whitespace-nowrap rounded-[var(--radius-control)] px-1.5 text-[12px] font-[640] text-pencil @[300px]:px-2 @[300px]:text-[13px]">
            {t("nextCue")}
            <span aria-hidden>›</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RingedTag({ text, delay }: { text: string; delay: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  useEffect(() => {
    const r = box.current?.getBoundingClientRect();
    if (r) setSize([Math.round(r.width), Math.round(r.height)]);
  }, [text]);
  return (
    <span ref={box} className="gr-tag relative px-2.5 py-1 text-[12px] font-[640] text-text [text-shadow:0_1px_3px_rgba(10,10,10,.85)]" style={{ "--d": `${delay}ms` } as CSSProperties}>
      {text}
      {size ? (
        <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={size[0]} height={size[1]} viewBox={`0 0 ${size[0]} ${size[1]}`}>
          <path d={ring(size[0], size[1], text)} pathLength={1} className="gr-stroke" style={{ animationDelay: `${delay}ms` }} stroke="var(--pencil)" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </svg>
      ) : null}
    </span>
  );
}

/** The foot of the picture: where the clip is, its measured cuts as ticks, its cues as pencil dots; a finger seeks. */
function Scrub({ fill, duration, cuts, cues, onSeek, label }: {
  fill: RefObject<HTMLSpanElement | null>; duration: number; cuts: readonly number[]; cues: readonly Cue[]; onSeek: (s: number) => void; label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const seekAt = (e: ReactPointerEvent) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || !duration) return;
    onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration);
  };
  const pct = (s: number) => `${Math.min(100, (s / (duration || 1)) * 100)}%`;
  return (
    <div
      ref={track}
      data-no-drag
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      tabIndex={-1}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seekAt(e); }}
      onPointerMove={(e) => { if (e.buttons) seekAt(e); }}
      className="absolute inset-x-3 bottom-0 z-[6] h-8 cursor-pointer touch-none"
    >
      <span className="absolute inset-x-0 bottom-3 h-[3px] overflow-hidden rounded-full bg-white/25">
        <span ref={fill} className="block h-full origin-left scale-x-0 rounded-full bg-white" />
      </span>
      {duration
        ? cuts.map((c) => <span key={`c${c}`} aria-hidden className="absolute bottom-[11px] h-[7px] w-px bg-white/45" style={{ left: pct(c) }} />)
        : null}
      {duration
        ? cues.map((c) => (
            <span key={`q${c.t}`} aria-hidden className="absolute bottom-[9.5px] size-1.5 -translate-x-1/2 rounded-full bg-pencil shadow-[0_0_0_1.5px_rgba(11,11,12,.7)]" style={{ left: pct(c.t) }} />
          ))
        : null}
    </div>
  );
}

