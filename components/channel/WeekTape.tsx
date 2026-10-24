// Lane A. The week as a tape: seven dated rows from today (Seoul). A row is the brief that day holds, its hook whole,
// its state as a word and one action; an empty day is a dashed slot that leads to teaching a short. No countdown, no
// percent, nothing promised.
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { shortDate, t, type UiLang, type WordKey } from "@/lib/words";
import type { BriefState, WeekDay } from "./week";

const STATE: Record<BriefState, { word: WordKey; tone: string }> = {
  draft: { word: "draft", tone: "text-text-dim" },
  approved: { word: "approved", tone: "text-ghost" },
  queued: { word: "renderQueued", tone: "text-accent" },
  rendering: { word: "renderRunning", tone: "text-accent" },
  ready: { word: "ready", tone: "text-ghost" },
  failed: { word: "renderFailed", tone: "text-danger" },
};

export function WeekTape({ days, later, ghostId, lang }: { days: WeekDay[]; later: number; ghostId: string; lang: UiLang }) {
  return (
    <section aria-labelledby="week" className="flex flex-col gap-2">
      <h2 id="week" className="text-[18px] font-[720] tracking-[-0.01em]">{t("week", lang)}</h2>
      <p className="text-[13px] text-text-3">{t("weekNote", lang)}</p>
      <ol aria-label={t("week", lang)} className="flex flex-col">
        {days.map((d) => (
          <li key={d.day} aria-current={d.today ? "date" : undefined}
            className="grid min-h-11 grid-cols-[4.5em_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-3">
            <span className={`font-mono text-[13px] ${d.today ? "text-action-text" : "text-text-3"}`}>
              {shortDate(d.day, lang)}
              {d.today ? <span className="sr-only"> ({t("today", lang)})</span> : null}
            </span>
            {d.brief && d.state ? (
              <>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] text-text">{lang === "ko" && d.brief.ko?.hook ? d.brief.ko.hook : d.brief.hook}</span>
                  <span className="text-[13px] text-text-3">
                    <span className={STATE[d.state].tone}>{d.state === "failed" ? "✕ " : ""}{t(STATE[d.state].word, lang)}</span>
                    {" · "}{t("written", lang)} <span className="font-mono">{shortDate(d.brief.createdAt, lang)}</span>
                  </span>
                </span>
                <ButtonLink href={`/brief/${d.brief.id}`} kind="secondary" size="m">
                  {t(d.state === "draft" ? "approve" : "open", lang)}
                </ButtonLink>
              </>
            ) : (
              <Link href={`/taste?ghost=${ghostId}`}
                className="col-span-2 flex min-h-11 items-center rounded-[var(--radius-control)] border border-dashed border-line-strong/60 px-3 text-[13px] font-[560] text-text-dim transition-colors duration-[125ms] hover:bg-surface hover:text-text">
                {t("briefOne", lang)}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {later > 0 ? (
        <p className="text-[13px] text-text-3"><span className="font-mono">{later}</span> {t("laterBriefs", lang)}</p>
      ) : null}
    </section>
  );
}
