// Outfit, scene, caption and hashtags: what the owner checks once, folded under one disclosure so the hook and the
// beats stay the screen.
import type { Brief } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";
import { fieldClass, labelClass } from "./field";

type Edit = (patch: Partial<Brief>) => void;
const TEXTS = [
  ["outfit", 160, 2],
  ["scene", 200, 2],
  ["caption", 300, 3],
] as const;

export function MoreDetail({ brief, editable, onEdit, lang }: { brief: Brief; editable: boolean; onEdit: Edit; lang: UiLang }) {
  return (
    <details className="group rounded-[var(--radius-card)] bg-surface">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-1 flex-col">
          <span className="text-[15px] font-[560]">{t("moreDetail", lang)}</span>
          <span className="text-[13px] text-text-3">{t("moreDetailNote", lang)}</span>
        </span>
        <span aria-hidden className="text-[15px] text-text-3 transition-transform duration-[250ms] group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
        {TEXTS.map(([key, max, rows]) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className={labelClass}>{t(key, lang)}</span>
            {editable ? (
              <textarea rows={rows} value={brief[key]} maxLength={max} onChange={(e) => onEdit({ [key]: e.target.value })} className={`${fieldClass} resize-none [field-sizing:content]`} />
            ) : (
              <p className="text-[15px] text-text-dim">{brief[key]}</p>
            )}
          </label>
        ))}
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("hashtags", lang)}</span>
          {editable ? (
            <input
              value={brief.hashtags.join(" ")}
              onChange={(e) => onEdit({ hashtags: e.target.value.split(/\s+/).slice(0, 8) })}
              className={fieldClass}
            />
          ) : (
            <p className="text-[15px] text-text-dim">{brief.hashtags.map((h) => `#${h}`).join(" ")}</p>
          )}
        </label>
      </div>
    </details>
  );
}
