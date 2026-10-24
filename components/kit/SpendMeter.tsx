// Lane B (gift from Lane A, 10-24). What is left of today's spend cap (briefs and renders), as a count and a bar,
// so the owner plans against it instead of meeting a 429. Turns amber at a fifth left.
import { remaining } from "./logic";

export function SpendMeter({ used, cap, lang = "en" }: { used: number; cap: number; lang?: "ko" | "en" }) {
  const { left, pct, low } = remaining(used, cap);
  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-[560]">{lang === "ko" ? "오늘 남은 생성" : "Left today"}</span>
        <span className="font-mono text-text-dim">{left} / {cap}</span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={left}
        aria-label={lang === "ko" ? "오늘 남은 생성" : "Left today"}
        className="h-1.5 overflow-hidden rounded-full bg-line"
      >
        <span className={`block h-full rounded-full ${low ? "bg-warn" : "bg-ghost"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
