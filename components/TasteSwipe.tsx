"use client";
// The daily taste game: one short at a time; drag or ←/→ to skip/keep, Z to undo. A keep asks what to keep.
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeepPart, TastePick, TrendCard as Card } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";
import { BriefStarter } from "./BriefStarter";
import { UnlockForm } from "./UnlockForm";
import { TrendCard } from "./TrendCard";

const PARTS: KeepPart[] = ["hook", "beat", "look", "sound"];
const THRESHOLD = 96;

export function TasteSwipe({ cards, ghostId, creatorId, lang = "en" }: { cards: Card[]; ghostId: string; creatorId?: string; lang?: UiLang }) {
  const [picks, setPicks] = useState<TastePick[]>([]);
  const [asking, setAsking] = useState<Card | null>(null);
  const [parts, setParts] = useState<KeepPart[]>(["hook"]);
  const [dx, setDx] = useState(0);
  const [toast, setToast] = useState(false);
  const [finished, setFinished] = useState(false);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const index = picks.length;
  const card = asking || finished ? null : cards[index];

  useEffect(() => {
    fetch(`/api/taste?ghost=${ghostId}`)
      .then((r) => r.json())
      .then((d: { picks?: TastePick[] }) => setPicks((d.picks ?? []).filter((p) => cards.some((c) => c.videoId === p.videoId))))
      .catch(() => {});
  }, [ghostId, cards]);

  // Only the owner writes picks; anyone else is asked for the passcode once, then the latest picks are saved.
  const [locked, setLocked] = useState<TastePick[] | null>(null);
  const persist = useCallback(
    async (next: TastePick[]) => {
      const res = await fetch("/api/taste", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ghostId, picks: next }),
      });
      setLocked(res.status === 401 ? next : null);
    },
    [ghostId],
  );

  const save = useCallback(
    (next: TastePick[]) => {
      setPicks(next);
      void persist(next);
      setToast(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(false), 5000);
    },
    [persist],
  );

  const pick = (c: Card, kept: boolean, keep: KeepPart[] = []) =>
    save([...picks, { ghostId, videoId: c.videoId, url: c.url, formatId: c.formatId, kept, keep, at: new Date().toISOString() }]);

  const decide = useCallback(
    (kept: boolean) => {
      if (!card) return;
      setDx(0);
      if (kept) {
        setAsking(card);
        setParts(["hook"]);
      } else pick(card, false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card, picks],
  );

  const confirmKeep = () => {
    if (!asking) return;
    pick(asking, true, parts);
    setAsking(null);
  };

  const undo = useCallback(() => {
    if (asking) return setAsking(null);
    if (picks.length) save(picks.slice(0, -1));
  }, [asking, picks, save]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "k") decide(true);
      else if (e.key === "ArrowLeft" || e.key === "j") decide(false);
      else if (e.key === "z" || e.key === "Backspace") undo();
      else if (e.key === "Enter" && asking) confirmKeep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const kept = picks.filter((p) => p.kept);

  return (
    <div className="flex flex-col gap-4">
      {locked ? (
        <div className="rounded-[var(--radius-card)] border border-warn/40 bg-surface p-3">
          <UnlockForm lang={lang} onUnlocked={() => void persist(locked)} />
        </div>
      ) : null}
      <div className="flex items-center justify-between text-[13px] text-text-dim">
        <span className="font-mono">
          {Math.min(index + 1, cards.length)} / {cards.length}
        </span>
        <span>
          {t("kept", lang)} <span className="font-mono font-semibold text-ghost">{kept.length}</span>
        </span>
      </div>

      {card ? (
        <div
          className="mx-auto w-full max-w-[calc(56dvh*9/16)] touch-pan-y cursor-grab active:cursor-grabbing"
          style={{ transform: `translateX(${dx}px) rotate(${dx / 24}deg)`, transition: drag.current ? "none" : "transform 180ms ease-out" }}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, id: e.pointerId };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => drag.current && setDx(e.clientX - drag.current.x)}
          onPointerUp={() => {
            drag.current = null;
            if (Math.abs(dx) > THRESHOLD) decide(dx > 0);
            else setDx(0);
          }}
        >
          <TrendCard card={card} lang={lang} />
        </div>
      ) : asking ? (
        <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="text-[18px] font-extrabold">{t("keepWhat", lang)}</p>
          <p className="text-[13px] text-text-dim">{asking.hook ?? asking.formatTitle}</p>
          <div className="flex flex-wrap gap-2">
            {PARTS.map((p) => {
              const on = parts.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setParts(on ? parts.filter((x) => x !== p) : [...parts, p])}
                  className={`h-10 rounded-full border px-4 text-[15px] font-semibold ${on ? "border-ghost bg-ghost/15 text-ghost" : "border-line text-text-dim"}`}
                >
                  {t(p, lang)}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={confirmKeep} disabled={!parts.length} className="h-12 rounded-[var(--radius-card)] bg-ghost font-extrabold text-bg disabled:opacity-40">
            {t("keep", lang)}
          </button>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-[18px] font-extrabold">{t("done", lang)}</p>
          <BriefStarter
            ghostId={ghostId}
            creatorId={creatorId}
            lang={lang}
            items={kept.map((p) => {
              const c = cards.find((x) => x.videoId === p.videoId);
              return { videoId: p.videoId, title: c?.formatTitle ?? c?.hook ?? p.videoId, keep: p.keep };
            })}
          />
        </section>
      )}

      {card ? (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => decide(false)} className="h-14 rounded-[var(--radius-card)] border border-line font-extrabold text-text-dim">
            ← {t("skip", lang)}
          </button>
          <button type="button" onClick={() => decide(true)} className="h-14 rounded-[var(--radius-card)] bg-ghost font-extrabold text-bg">
            {t("keep", lang)} →
          </button>
          {kept.length > 0 ? (
            <button type="button" onClick={() => setFinished(true)} className="col-span-2 h-10 text-[13px] font-semibold text-ghost">
              {t("done", lang)} · {t("writeBrief", lang)} →
            </button>
          ) : null}
        </div>
      ) : null}

      {toast && picks.length > 0 ? (
        <button type="button" onClick={undo} className="self-center rounded-full bg-surface-2 px-4 py-2 text-[13px] font-semibold">
          {t("undo", lang)} (Z)
        </button>
      ) : null}
    </div>
  );
}
