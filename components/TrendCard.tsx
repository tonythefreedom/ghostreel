"use client";
// One short as Shorti read it: a real creator's post, so it never wears the AI label. A 9:16 picture (the poster;
// a raised tile until it loads), its tag on Vellum, then at most three lines under it, never cut: what happens first,
// who and where, and the platform's count with its date. One number a card.
import { useState } from "react";
import type { TrendCard as Card } from "@/lib/types";
import { TrustLine } from "./TrustLine";
import type { UiLang } from "@/lib/words";

const PLATFORM: Record<string, string> = { instagram: "Reels", tiktok: "TikTok", youtube: "Shorts" };

/** `behind` draws a card under the deck's top one: its picture's edge alone, its words hidden. */
export function TrendCard({ card, lang = "en", behind = false }: { card: Card; lang?: UiLang; behind?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const title = card.hook ?? card.formatTitle ?? card.whatHappens ?? "";
  const sound = card.formatKind === "sound" && card.formatTitle ? `♪ ${card.formatTitle}` : null;
  const meta = [card.by, PLATFORM[card.platform] ?? card.platform, sound].filter(Boolean).join(" · ");

  return (
    <article className="flex flex-col gap-2 bg-bg select-none">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-pic)] bg-surface-2">
        {card.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- poster URLs come from Shorti answers, not a fixed host
          <img
            src={card.posterUrl}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            decoding="async"
            ref={(el) => { if (el?.complete && el.naturalWidth) setLoaded(true); }} // loaded before hydration
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-[125ms] ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : null}
        {card.tag && !behind ? (
          <span className="vellum absolute left-2 top-2 rounded-full px-2.5 py-1 text-[12px] font-[560]">{card.tag}</span>
        ) : null}
      </div>
      <div className={`flex flex-col gap-1 ${behind ? "invisible" : ""}`} aria-hidden={behind || undefined}>
        {title ? <p className="text-[15px] font-[560] leading-snug text-text">{title}</p> : null}
        {meta ? <p className="text-[13px] text-text-3">{meta}</p> : null}
        <TrustLine views={card.views} asOf={card.viewsAsOf} lang={lang} />
      </div>
    </article>
  );
}
