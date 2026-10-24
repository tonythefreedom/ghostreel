// One short as Shorti read it: 9:16 poster, tag, hook, handle, the platform's count.
import type { TrendCard as Card } from "@/lib/types";
import { TrustLine } from "./TrustLine";
import type { UiLang } from "@/lib/words";

const PLATFORM: Record<string, string> = { instagram: "Reels", tiktok: "TikTok", youtube: "Shorts" };

export function TrendCard({ card, lang = "en" }: { card: Card; lang?: UiLang }) {
  return (
    <article className="relative aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface select-none">
      {card.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- poster URLs come from Shorti answers, not a fixed host
        <img
          src={card.posterUrl}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-surface-2 to-bg" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-transparent to-bg/95" />

      <header className="absolute inset-x-0 top-0 flex items-center gap-2 p-3 text-[12px] font-semibold">
        <span className="rounded-full bg-bg/70 px-2 py-0.5">{PLATFORM[card.platform] ?? card.platform}</span>
        {card.tag ? <span className="rounded-full bg-accent/80 px-2 py-0.5">{card.tag}</span> : null}
      </header>

      <footer className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
        {card.formatTitle ? <p className="text-[12px] font-semibold text-ghost">{card.formatTitle}</p> : null}
        <p className="text-[15px] font-semibold leading-snug">{card.hook ?? card.whatHappens ?? ""}</p>
        <div className="flex items-center justify-between gap-2">
          <TrustLine views={card.views} asOf={card.viewsAsOf} lang={lang} />
          {card.by ? <span className="truncate text-[12px] text-text-dim">{card.by}</span> : null}
        </div>
      </footer>
    </article>
  );
}
