// The selected beat, opened: what the ghost says and does from its second, as plain fields while the brief is a
// draft and as words once it is approved. Never a prompt, never JSON. On a Korean page each line's Korean sits under
// the words the ghost performs (an edited beat says its Korean comes with the next version).
import type { BriefLine } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";
import { fieldClass, labelClass } from "./field";

export function BeatCard({ line, index, editable, maxT, canRemove, onChange, onRemove, ko = false, lang }: {
  line: BriefLine;
  index: number;
  editable: boolean;
  maxT: number;
  canRemove: boolean;
  onChange: (patch: Partial<BriefLine>) => void;
  onRemove: () => void;
  /** show the beat's Korean (a Korean page, a brief written with it) */
  ko?: boolean;
  lang: UiLang;
}) {
  const gloss = (text: string | undefined) =>
    ko ? (
      text ? (
        <span className="text-[13px] leading-snug text-text-3"><span className="mr-1.5 font-[640] text-pencil">{t("koMeaning", lang)}</span>{text}</span>
      ) : (
        <span className="text-[12px] leading-snug text-text-3">{t("koStale", lang)}</span>
      )
    ) : null;
  const name = `${t("beatWord", lang)} ${index + 1}`;
  return (
    <section role="tabpanel" aria-label={name} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-4">
      <div className="flex min-h-9 items-center gap-2 text-[13px] text-text-3">
        <span className="font-[560] text-text-dim">{name}</span>
        <span aria-hidden>·</span>
        {editable && index > 0 ? (
          <label className="flex items-center gap-1.5">
            <span className="sr-only">{t("startsAt", lang)}</span>
            <input
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0}
              max={maxT}
              value={line.t}
              onChange={(e) => onChange({ t: Number(e.target.value) })}
              className="h-9 w-[4.5rem] rounded-[10px] bg-surface-2 px-2 font-mono text-[13px] text-text ring-1 ring-inset ring-line hover:ring-line-strong"
            />
            s
          </label>
        ) : (
          <span>
            <span className="font-mono">{line.t.toFixed(1)}</span>s
          </span>
        )}
        {editable && canRemove ? (
          <button type="button" onClick={onRemove} className="-mr-2 ml-auto h-9 px-2 text-[13px] text-text-3 hover:text-text">
            {t("remove", lang)}
          </button>
        ) : null}
      </div>

      {editable ? (
        <>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t("say", lang)}</span>
            <input value={line.say} maxLength={200} onChange={(e) => onChange({ say: e.target.value })} className={`${fieldClass} font-[560]`} />
            {gloss(line.ko?.say)}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t("doLabel", lang)}</span>
            <textarea rows={2} value={line.do} maxLength={200} onChange={(e) => onChange({ do: e.target.value })} className={`${fieldClass} resize-none [field-sizing:content] min-h-[4.5rem] text-text-dim`} />
            {line.ko || !ko ? gloss(line.ko?.do) : null}
          </label>
        </>
      ) : (
        <>
          <p className="text-[15px] font-[560]">“{line.say}”</p>
          {ko && line.ko ? <p className="-mt-1.5 text-[13px] text-text-dim">{line.ko.say}</p> : null}
          <p className="text-[13px] text-text-dim">{ko && line.ko?.do ? line.ko.do : line.do}</p>
        </>
      )}
    </section>
  );
}
