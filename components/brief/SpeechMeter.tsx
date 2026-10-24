// Rough spoken length against the duration's budget, so the owner trims before a render does it for them.
// Over budget says so in words beside the figure, never in colour alone.
import { speechBudget, speechSeconds } from "@/lib/speech";
import type { Brief } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";

export function SpeechMeter({ brief, lang }: { brief: Brief; lang: UiLang }) {
  const used = speechSeconds(brief.lines, brief.lang);
  const budget = speechBudget(brief.durationSec, brief.lang).seconds;
  const over = used > budget;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] text-text-3">
      <span className="font-mono">9:16</span>
      <span aria-hidden>·</span>
      <span className="font-mono">{brief.lang.toUpperCase()}</span>
      <span aria-hidden>·</span>
      <span className={over ? "text-danger" : undefined}>
        {t("speech", lang)} <span className="font-mono">~{used.toFixed(1)}</span>s / <span className="font-mono">{budget.toFixed(0)}</span>s
        {over ? ` ✕ ${t("speechOver", lang)}` : ""}
      </span>
    </p>
  );
}
