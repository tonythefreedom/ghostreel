"use client";
// The taste deck as a fan (DESIGN.md › Motion on screens): the top card and two behind it, each 22 px right, 7 px down
// at 0.96, settling on the fan spring; the ones behind are inert. A sideways drag moves the top card; past 96 px it
// decides (right keeps, left skips). A decided card leaves on `leave`: kept up and right, skipped down and left.
// A tap is never a pick. Reduced motion: no fan, no flight, fades only.
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import type { TrendCard as Card } from "@/lib/types";
import type { UiLang } from "@/lib/words";
import { TrendCard } from "../TrendCard";

export type Leaving = { card: Card; kept: boolean; dx: number };

const DECIDE = 96;
// The fan's offsets are measured from each card's top left; the cards turn about their foot, so the scale's shift is
// taken back out in percent of the card's own box (1 - 0.96 = 4 %, 1 - 0.9216 = 7.84 %).
const FAN = [
  "none",
  "translate(calc(22px - 2%), calc(7px - 4%)) scale(0.96)",
  "translate(calc(44px - 3.92%), calc(14px - 7.84%)) scale(0.9216)",
];
const SETTLE = "transform var(--spring-fan-ms) var(--spring-fan), opacity var(--move-lift)";
const tilt = (dx: number) => `translateX(${dx}px) rotate(${dx / 40}deg)`;

export function Deck({ cards, leaving, onDecide, onGone, label, lang }: {
  /** The top card first, then up to two behind it. */
  cards: Card[];
  leaving: Leaving | null;
  onDecide: (kept: boolean, dx: number) => void;
  onGone: () => void;
  label: string;
  lang: UiLang;
}) {
  const reduced = useReducedMotion();
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, dx: 0 };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current.dx = e.clientX - drag.current.x;
    setDx(drag.current.dx);
  };
  const up = (decide: boolean) => {
    const d = drag.current?.dx ?? 0;
    drag.current = null;
    setDragging(false);
    setDx(0);
    if (decide && Math.abs(d) > DECIDE) onDecide(d > 0, d);
  };

  return (
    <div role="group" aria-roledescription="deck" aria-label={label} className="mx-auto grid w-full max-w-[calc(46dvh*9/16+44px)] pr-11">
      {cards.slice(0, 3).map((c, layer) => {
        const top = layer === 0;
        return (
          <div
            key={c.videoId}
            inert={!top}
            className={`[grid-area:1/1] ${top ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""}`}
            style={{
              zIndex: 3 - layer,
              transformOrigin: "50% 100%",
              transform: top ? (dx ? tilt(dx) : "none") : reduced ? "none" : FAN[layer],
              opacity: layer === 2 && !reduced ? 0.85 : 1,
              transition: top && dragging ? "none" : SETTLE,
            }}
            onPointerDown={top ? down : undefined}
            onPointerMove={top ? move : undefined}
            onPointerUp={top ? () => up(true) : undefined}
            onPointerCancel={top ? () => up(false) : undefined}
          >
            <TrendCard card={c} lang={lang} behind={!top} />
          </div>
        );
      })}
      {leaving ? <Flight key={`leave-${leaving.card.videoId}`} {...leaving} reduced={reduced} onGone={onGone} lang={lang} /> : null}
    </div>
  );
}

/** The decided card on its way out, drawn over the deck; gone after the move. */
function Flight({ card, kept, dx, reduced, onGone, lang }: Leaving & { reduced: boolean; onGone: () => void; lang: UiLang }) {
  const [out, setOut] = useState(false);
  const gone = useRef(onGone);
  useEffect(() => {
    gone.current = onGone;
  });
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setOut(true));
    });
    const end = setTimeout(() => gone.current(), 320);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(end);
    };
  }, []);
  const away = kept ? "translate(64%, -42%) rotate(12deg)" : "translate(-72%, 26%) rotate(-10deg)";
  return (
    <div
      inert
      aria-hidden
      className="pointer-events-none [grid-area:1/1]"
      style={{
        zIndex: 4,
        transformOrigin: "50% 100%",
        transform: reduced ? "none" : out ? away : tilt(dx),
        opacity: out ? 0 : 1,
        transition: "transform var(--move-leave), opacity var(--move-leave)",
      }}
    >
      <TrendCard card={card} lang={lang} />
    </div>
  );
}

const query = "(prefers-reduced-motion: reduce)";
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (on) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", on);
      return () => m.removeEventListener("change", on);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
