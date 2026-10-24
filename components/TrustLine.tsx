// Where a number came from and when it was read: "1.06M views · platform count · Oct 21". Never a forecast.
import type { ReactNode } from "react";
import { shortDate, t, viewCount, type UiLang } from "@/lib/words";

export function TrustLine({ views, asOf, lang = "en" }: { views?: number; asOf?: string; lang?: UiLang }) {
  if (views === undefined) return null;
  const date = asOf ? shortDate(asOf, lang) : "";
  return (
    <p className="text-[13px] text-text-3">
      <span className="whitespace-nowrap">
        <span className="font-mono text-text-dim">{viewCount(views, lang)}</span> {t("views", lang)}
      </span>{" "}
      · <span className="whitespace-nowrap">{t("platformCount", lang)}</span>
      {date ? <span className="whitespace-nowrap"> · {date}</span> : null}
    </p>
  );
}

/** A small gold pill for anything recorded, pre-rendered or offline (DESIGN.md › Components). */
export function DemoTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-warn/15 px-2.5 py-1 text-[12px] font-[560] text-warn">
      {children}
    </span>
  );
}
