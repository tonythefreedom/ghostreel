"use client";
// The daily taste game: eight shorts as a fanned deck. Drag the top card, ←/→, or the docked verbs skip or keep;
// Z undoes. A keep asks in a sheet what to keep; the end lists what was kept and writes the brief from one.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeepPart, TastePick, TrendCard as Card, VideoReading } from "@/lib/types";
import { fill, t, type UiLang } from "@/lib/words";
import { Button, Empty, Verb } from "./ui";
import { BriefStarter } from "./BriefStarter";
import { UnlockForm } from "./UnlockForm";
import { Deck, type Leaving } from "./taste/Deck";
import { KeepSheet } from "./taste/KeepSheet";
import { useLang } from "@/components/Lang";

const ROUND = 20; // this week's radar, hits and season (Ted, 10-24: «8개밖에 안뜨는데 … 좀 더»)

export function TasteSwipe({ cards: all, readings = {}, ghostId, creatorId, lang: langProp }: { cards: Card[]; readings?: Record<string, VideoReading>; ghostId: string; creatorId?: string; lang?: UiLang }) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const deck = useMemo(() => all.slice(0, ROUND), [all]);
  // Shorts already decided come first, in the order they were decided, so the deck resumes where it stopped even when
  // Claude kept one out of order over MCP.
  const [order, setOrder] = useState<string[]>([]);
  const cards = useMemo(() => {
    const first = order.map((id) => deck.find((c) => c.videoId === id)).filter((c): c is Card => Boolean(c));
    return [...first, ...deck.filter((c) => !order.includes(c.videoId))];
  }, [deck, order]);
  // Picks from other decks (the other field, the other language, Claude's) are kept and sent back with every save;
  // the store holds one list per ghost, so leaving them out would erase them.
  const others = useRef<TastePick[]>([]);
  const [picks, setPicks] = useState<TastePick[]>([]);
  const [asking, setAsking] = useState<Card | null>(null);
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const [finished, setFinished] = useState(false);
  const [locked, setLocked] = useState<TastePick[] | null>(null);

  const index = picks.length;
  const done = finished || index >= cards.length;
  const top = asking ? index + 1 : index; // a kept card has left the deck while its sheet asks
  const card = done || asking ? null : (cards[index] ?? null);
  const kept = picks.filter((p) => p.kept);

  useEffect(() => {
    fetch(`/api/taste?ghost=${ghostId}`)
      .then((r) => r.json())
      .then((d: { picks?: TastePick[] }) => {
        const saved = d.picks ?? [];
        const inDeck = saved.filter((p) => deck.some((c) => c.videoId === p.videoId));
        others.current = saved.filter((p) => !deck.some((c) => c.videoId === p.videoId));
        setOrder(inDeck.map((p) => p.videoId));
        setPicks(inDeck);
      })
      .catch(() => {});
  }, [ghostId, deck]);

  // Picks are the signed-in account's own; anyone else is asked to sign in once, then the latest picks are saved.
  const persist = useCallback(
    async (next: TastePick[]) => {
      try {
        const res = await fetch("/api/taste", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ghostId, picks: [...others.current, ...next] }),
        });
        setLocked(res.status === 401 ? next : null);
      } catch {
        // offline: the picks stay on screen and go with the next save
      }
    },
    [ghostId],
  );
  const save = useCallback((next: TastePick[]) => {
    setPicks(next);
    void persist(next);
  }, [persist]);

  const pickOf = useCallback(
    (c: Card, isKept: boolean, keep: KeepPart[]): TastePick => ({ ghostId, videoId: c.videoId, url: c.url, formatId: c.formatId, kept: isKept, keep, at: new Date().toISOString() }),
    [ghostId],
  );

  const decide = useCallback(
    (isKept: boolean, dx = 0) => {
      if (!card) return;
      setLeaving({ card, kept: isKept, dx });
      if (isKept) setAsking(card);
      else save([...picks, pickOf(card, false, [])]);
    },
    [card, picks, save, pickOf],
  );

  const confirmKeep = (parts: KeepPart[]) => {
    if (!asking) return;
    save([...picks, pickOf(asking, true, parts)]);
    setAsking(null);
  };

  const undo = useCallback(() => {
    if (asking) return setAsking(null);
    if (finished && index < cards.length) return setFinished(false);
    if (!picks.length) return;
    setFinished(false);
    save(picks.slice(0, -1));
  }, [asking, finished, index, cards.length, picks, save]);

  // → keeps, ← skips, Z undoes; never from a field, never with a modifier, never under the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || asking) return;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        undo();
      } else if (card && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        decide(e.key === "ArrowRight");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking, card, decide, undo]);

  const undoButton = picks.length || finished ? (
    <Button kind="secondary" size="xl" onClick={undo}>
      {t("undo", lang)}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col gap-4">
      {locked ? (
        <div className="rounded-[var(--radius-card)] border border-warn/40 bg-surface p-4">
          <UnlockForm lang={lang} onUnlocked={() => void persist(locked)} />
        </div>
      ) : null}

      {done ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-[720] tracking-[-0.02em]">{t("keptTitle", lang)}</h2>
            {kept.length ? <p className="text-[15px] text-text-dim">{t("keptSub", lang)}</p> : null}
          </div>
          {kept.length ? (
            <BriefStarter
              ghostId={ghostId}
              creatorId={creatorId}
              lang={lang}
              back={undoButton}
              items={kept.map((p) => {
                const c = cards.find((x) => x.videoId === p.videoId);
                return { videoId: p.videoId, title: c?.hook ?? c?.formatTitle ?? p.videoId, keep: p.keep, poster: c?.posterUrl };
              })}
            />
          ) : (
            <Empty head={t("nothingKept", lang)} line={t("nothingKeptLine", lang)} action={undoButton} />
          )}
        </section>
      ) : (
        <>
          <div className="flex min-h-11 items-center gap-3 text-[13px] text-text-3">
            <span className="font-mono text-[15px] text-text" aria-live="polite">
              {Math.min(top + 1, cards.length)} / {cards.length}
            </span>
            {kept.length ? null : (
              <span>
                {t("kept", lang)} <span className="font-mono text-ghost">{kept.length}</span>
              </span>
            )}
            <span className="flex-1" />
            {picks.length ? (
              <Button kind="quiet" onClick={undo}>
                {t("undo", lang)}
              </Button>
            ) : null}
            {/* The way on, in plain sight once one short is kept (Ted, 10-24: a grey "Done" was easy to miss). */}
            {kept.length ? (
              <button type="button" onClick={() => setFinished(true)}
                className="flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ghost/15 px-3.5 text-[13px] font-[720] text-ghost ring-1 ring-inset ring-ghost/50 transition-colors duration-[125ms] hover:bg-ghost/25">
                ✓ {fill(t("writeFromKept", lang), { n: kept.length })} <span aria-hidden>→</span>
              </button>
            ) : null}
          </div>
          <Deck cards={cards.slice(top, top + 3)} readings={readings} leaving={leaving} onDecide={decide} onGone={() => setLeaving(null)} label={t("deck", lang)} lang={lang} />
          {asking ? null : (
            <Verb>
              <Button kind="secondary" size="xl" disabled={!card} onClick={() => decide(false)}>
                ← {t("skip", lang)}
              </Button>
              <Button size="xl" disabled={!card} onClick={() => decide(true)}>
                {t("keep", lang)} →
              </Button>
            </Verb>
          )}
        </>
      )}

      <KeepSheet card={asking} onKeep={confirmKeep} onCancel={() => setAsking(null)} lang={lang} />
    </div>
  );
}
