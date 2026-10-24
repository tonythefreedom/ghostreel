// The brief's head: whose brief it is (the ghost's violet monogram), its state as a word, and its length.
import type { Brief } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";

export function BriefHead({ name, status, version = 1, duration, editable, onDuration, lang }: {
  name: string;
  status: Brief["status"];
  version?: number;
  duration: Brief["durationSec"];
  editable: boolean;
  onDuration: (d: Brief["durationSec"]) => void;
  lang: UiLang;
}) {
  const approved = status === "approved";
  return (
    <header className="flex items-center gap-3">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-[15px] font-[720] text-white">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-[720] leading-tight">{name}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-text-3">
          {t("briefTitle", lang)}
          <span
            className={`inline-flex h-6 items-center rounded-full px-2 text-[12px] font-[560] ${
              approved ? "bg-ghost/15 text-ghost" : "text-text-dim ring-1 ring-inset ring-line-strong"
            }`}
          >
            {approved ? `✓ ${t("approved", lang)}` : t("draft", lang)}
          </span>
          {version > 1 ? <span className="font-mono text-[12px] font-[640] text-pencil">v{version}</span> : null}
        </span>
      </div>
      {editable ? (
        <div
          role="radiogroup"
          aria-label={t("length", lang)}
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
            e.preventDefault();
            onDuration(duration === 10 ? 15 : 10);
          }}
          className="flex shrink-0 rounded-[var(--radius-control)] p-0.5 ring-1 ring-inset ring-line-strong">
          {([10, 15] as const).map((d) => {
            const on = duration === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => onDuration(d)}
                className={`h-10 min-w-11 rounded-[12px] px-2.5 text-[13px] transition-[background-color,color] duration-[125ms] ${
                  on ? "bg-text font-[720] text-bg" : "text-text-dim hover:text-text"
                }`}
              >
                <span className="font-mono">{d}</span>s
              </button>
            );
          })}
        </div>
      ) : (
        <span className="shrink-0 text-[13px] text-text-dim">
          <span className="font-mono">{duration}</span>s
        </span>
      )}
    </header>
  );
}
