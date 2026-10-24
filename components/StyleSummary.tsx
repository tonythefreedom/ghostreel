// Lane B (T22). The creator's style as Shorti read it from their own shorts: openings, shared moves, tempo, length.
import type { CreatorStyle } from "@/lib/creatorStyle";

export function StyleSummary({ style }: { style: CreatorStyle }) {
  if (style.read === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <h2 className="text-[15px] font-extrabold">Your style</h2>
        <p className="text-[13px] text-text-dim">
          Shorti couldn't read your {style.total} shorts yet. Check that they are public TikTok, Reels or Shorts links.
          Meanwhile your ghost learns from this week's trends.
        </p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-extrabold">Your style</h2>
        <span className="font-mono text-[11px] text-text-dim">
          Shorti read {style.read}/{style.total}
          {style.bpm ? ` · ${Math.round(style.bpm)} BPM` : ""}
          {style.lengthSec ? ` · ${style.lengthSec.toFixed(1)}s` : ""}
        </span>
      </div>

      {style.hooks.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-semibold text-text-dim">Your openings</h3>
          <ul className="flex flex-col gap-1">
            {style.hooks.map((h) => (
              <li key={h} className="text-[13px] leading-snug">· {h}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {style.moves.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-semibold text-text-dim">Moves your formats' hits share</h3>
          <ul className="flex flex-col gap-2">
            {style.moves.map((m) => (
              <li key={m.cue} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">
                  {m.cue}
                  {style.read > 1 ? <span className="font-mono text-[11px] text-text-dim"> · in {m.count} of yours</span> : null}
                </span>
                <span className="text-[12px] leading-snug text-text-dim">{m.do}</span>
                {m.share ? <span className="text-[11px] text-ghost">{m.share}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {style.makeItYours.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-semibold text-text-dim">What your ghost can make its own</h3>
          <div className="flex flex-wrap gap-1.5">
            {style.makeItYours.map((x) => (
              <span key={x} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-text-dim">{x}</span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-[11px] text-text-dim">Counted from what Shorti read. No views or results are forecast.</p>
    </section>
  );
}
