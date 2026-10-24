"use client";
// Shared. A reel's beats in order: a hairline track with an optional playhead, then up to six chips (a tablist: arrow
// keys, Home, End). Pressing a chip selects that beat; the screen decides what selecting does.
import { useRef, type KeyboardEvent, type ReactNode } from "react";

export type Beat = { title: ReactNode; at: number; note?: ReactNode };

export function Rail({ beats, selected, onSelect, at, length, label = "Beats" }: {
  beats: Beat[];
  selected: number;
  onSelect: (i: number) => void;
  /** Playhead position and reel length in seconds; leave out for a still rail. */
  at?: number;
  length?: number;
  label?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = beats.slice(0, 6);
  const key = (e: KeyboardEvent, i: number) => {
    const n = shown.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (next === null) return;
    e.preventDefault();
    onSelect(next);
    refs.current[next]?.focus();
  };
  const span = length && length > 0 ? length : null;

  return (
    <div className="flex flex-col gap-3">
      {span ? (
        <div className="relative h-0.5 rounded-full bg-line" aria-hidden>
          {shown.map((b, i) => (
            <span key={i} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line-strong" style={{ left: `${Math.min(100, (b.at / span) * 100)}%` }} />
          ))}
          {at != null ? (
            <span className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action" style={{ left: `${Math.min(100, (at / span) * 100)}%` }} />
          ) : null}
        </div>
      ) : null}
      <div role="tablist" aria-label={label} className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
        {shown.map((b, i) => {
          const on = i === selected;
          return (
            <button
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              role="tab"
              type="button"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => key(e, i)}
              className={`flex min-h-11 shrink-0 flex-col items-start justify-center rounded-full px-3 py-1 text-left text-[13px] font-[560] transition-[background-color,color] duration-[125ms] active:scale-[.97] ${
                on ? "bg-text text-bg" : "text-text ring-1 ring-inset ring-line-strong hover:bg-surface"
              }`}
            >
              <span className="flex items-baseline gap-1.5">
                <span className={`font-mono text-[12px] ${on ? "text-bg/70" : "text-text-3"}`}>{b.at.toFixed(1)}s</span>
                {b.title}
              </span>
              {b.note ? <span className={`text-[12px] font-normal ${on ? "text-bg/70" : "text-text-3"}`}>{b.note}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
