"use client";
// Lane B (gift from Lane A, 10-24). The top of a step-by-step flow (onboarding): a back button and a bar of segments,
// one per step, filled up to where the person is. One question per screen reads faster than one long form.
import { segments } from "./logic";

type Props = { step: number; total: number; onBack?: () => void; lang?: "ko" | "en" };

export function FunnelProgress({ step, total, onBack, lang = "en" }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack || step <= 1}
        aria-label={lang === "ko" ? "이전" : "Back"}
        className="grid size-10 shrink-0 place-items-center rounded-full text-[18px] text-text disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ghost"
      >
        ←
      </button>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-valuetext={lang === "ko" ? `${total}단계 중 ${step}단계` : `Step ${step} of ${total}`}
        className="flex flex-1 gap-1"
      >
        {segments(step, total).map((s, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${s === "ahead" ? "bg-line" : s === "now" ? "bg-accent" : "bg-ghost"}`} />
        ))}
      </div>
      <span className="w-10 text-right font-mono text-[13px] text-text-dim">{step}/{total}</span>
    </div>
  );
}
