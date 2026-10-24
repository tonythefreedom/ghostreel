// The Pick band's picture: the four parts a person can keep from a short, two of them kept. Words, not controls.
import { t, type UiLang, type WordKey } from "@/lib/words";

const PARTS: { key: WordKey; kept: boolean }[] = [
  { key: "hook", kept: true },
  { key: "beat", kept: true },
  { key: "look", kept: false },
  { key: "sound", kept: false },
];

export function KeepVisual({ lang = "en" }: { lang?: UiLang }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-4">
      <p className="text-[13px] font-[560] text-text-3">{t("keepWhat", lang)}</p>
      <div className="flex flex-wrap gap-2">
        {PARTS.map((p) => (
          <span
            key={p.key}
            className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] ${
              p.kept ? "bg-ghost/15 font-[560] text-ghost" : "text-text-dim ring-1 ring-inset ring-line-strong"
            }`}
          >
            {p.kept ? `✓ ${t(p.key, lang)}` : t(p.key, lang)}
          </span>
        ))}
      </div>
    </div>
  );
}
