// Where a number came from and when it was read. Never a forecast.
import { shortDate, t, viewCount, type UiLang } from "@/lib/words";

export function TrustLine({ views, asOf, lang = "ko" }: { views?: number; asOf?: string; lang?: UiLang }) {
  if (views === undefined) return null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-text-dim">
      <EyeIcon />
      <span className="font-mono font-semibold text-text">{viewCount(views, lang)}</span>
      <span>
        · {t("platformCount", lang)}
        {asOf ? ` · ${shortDate(asOf, lang)} ${t("readBy", lang)}` : ""}
      </span>
    </p>
  );
}

export function DemoTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-semibold text-warn">
      {children}
    </span>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
