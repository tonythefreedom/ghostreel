// Lane B (T22). The creator's style as Shorti read it from their own shorts: openings, shared moves, tempo, length.
import type { CreatorStyle } from "@/lib/creatorStyle";
import { t, type UiLang } from "@/lib/words";

export function StyleSummary({ style, lang }: { style: CreatorStyle; lang: UiLang }) {
  if (style.read === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface p-5">
        <h2 className="text-[18px] font-[720]">{t("pfStyle", lang)}</h2>
        <p className="text-[13px] leading-snug text-text-dim">{t("pfUnread", lang).replace("{n}", String(style.total))}</p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-surface p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-[720]">{t("pfStyle", lang)}</h2>
        <span className="font-mono text-[12px] text-text-dim">
          {t("readBy", lang)} {style.read}/{style.total}
          {style.bpm ? ` · ${Math.round(style.bpm)} BPM` : ""}
          {style.lengthSec ? ` · ${style.lengthSec.toFixed(1)}s` : ""}
        </span>
      </div>

      {style.hooks.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-[560] text-text-dim">{t("pfOpenings", lang)}</h3>
          <ul className="flex flex-col gap-1">
            {style.hooks.map((h) => (
              <li key={h} className="text-[13px] leading-snug">· {h}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {style.moves.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-[560] text-text-dim">{t("pfMoves", lang)}</h3>
          <ul className="flex flex-col gap-2">
            {style.moves.map((m) => (
              <li key={m.cue} className="flex flex-col gap-0.5">
                <span className="text-[13px] font-[560]">
                  {m.cue}
                  {style.read > 1 ? <span className="font-mono text-[12px] text-text-dim"> · {m.count}/{style.read}</span> : null}
                </span>
                <span className="text-[12px] leading-snug text-text-dim">{m.do}</span>
                {m.share ? <span className="text-[12px] text-text-3">{m.share}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {style.makeItYours.length ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[12px] font-[560] text-text-dim">{t("pfOwn", lang)}</h3>
          <p className="text-[13px] leading-snug">{style.makeItYours.join(" · ")}</p>
        </div>
      ) : null}

      <p className="text-[12px] text-text-3">{t("pfCounted", lang)}</p>
    </section>
  );
}
