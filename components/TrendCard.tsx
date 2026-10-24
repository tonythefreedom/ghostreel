"use client";
// One short as Shorti read it: a real creator's post, so it never wears the AI label. The deck's top card plays Shorti's
// own copy of the hit in place, with the same keys as every video and the coaching pencil on its cues; a card behind it
// is its poster alone. Under the picture at most three lines, never cut: what happens first, who and where, and the
// platform's count with its date. One number a card.
import { useState } from "react";
import { hitCues } from "@/lib/cues";
import type { TrendCard as Card, VideoReading } from "@/lib/types";
import type { UiLang } from "@/lib/words";
import { useLang } from "@/components/Lang";
import { TrustLine } from "./TrustLine";
import { Player } from "./ui";

const PLATFORM: Record<string, string> = { instagram: "Reels", tiktok: "TikTok", youtube: "Shorts" };

/** `live` plays the hit (the deck's top card); `behind` draws a card under it: its picture's edge alone, words hidden. */
export function TrendCard({ card, reading, live = false, behind = false, lang: langProp }: {
  card: Card;
  reading?: VideoReading | null;
  live?: boolean;
  behind?: boolean;
  lang?: UiLang;
}) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const [loaded, setLoaded] = useState(false);
  const title = card.hook ?? card.formatTitle ?? card.whatHappens ?? "";
  const sound = card.formatKind === "sound" && card.formatTitle ? `♪ ${card.formatTitle}` : null;
  const meta = [card.by, PLATFORM[card.platform] ?? card.platform, sound].filter(Boolean).join(" · ");
  const tag = card.tag && !behind ? <span className="vellum block max-w-full truncate rounded-full px-2.5 py-1 text-[12px] font-[560]">{card.tag}</span> : null;

  return (
    <article className="flex flex-col gap-2 bg-bg select-none">
      {live && card.clipUrl ? (
        <Player
          src={card.clipUrl}
          poster={card.posterUrl}
          ai={false}
          label={title}
          marks={tag}
          cues={hitCues(reading)}
          cuts={reading?.cuts}
          coachFirst={false}
        />
      ) : (
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
          {tag ? <span className="absolute left-2 top-2">{tag}</span> : null}
        </div>
      )}
      <div className={`flex flex-col gap-1 ${behind ? "invisible" : ""}`} aria-hidden={behind || undefined}>
        {title ? <p className="text-[15px] font-[560] leading-snug text-text">{title}</p> : null}
        {meta ? <p className="text-[13px] text-text-3">{meta}</p> : null}
        <TrustLine views={card.views} asOf={card.viewsAsOf} lang={lang} />
      </div>
    </article>
  );
}
