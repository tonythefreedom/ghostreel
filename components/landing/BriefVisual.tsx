// The Approve band's picture: a brief in miniature, its hook and three timed beats, marked as an example.
import { t, type UiLang, type WordKey } from "@/lib/words";

const BEATS: { at: number; key: WordKey }[] = [
  { at: 0, key: "landingSampleBeat1" },
  { at: 3, key: "landingSampleBeat2" },
  { at: 9, key: "landingSampleBeat3" },
];

export function BriefVisual({ lang = "en" }: { lang?: UiLang }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-4">
      <div className="flex items-center gap-2 text-[13px] text-text-3">
        <span className="grid size-6 place-items-center rounded-full bg-accent text-[12px] font-[720] text-white">Y</span>
        {t("briefTitle", lang)}
        <span className="ml-auto">{t("landingSample", lang)}</span>
      </div>
      <p className="text-[18px] font-[720] tracking-[-0.02em]">{t("landingSampleHook", lang)}</p>
      <ol className="flex flex-col">
        {BEATS.map((b) => (
          <li key={b.key} className="flex min-h-9 items-center gap-3 border-t border-line text-[13px]">
            <span className="w-9 font-mono text-text-3">{b.at.toFixed(1)}s</span>
            <span className="text-text-dim">{t(b.key, lang)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
