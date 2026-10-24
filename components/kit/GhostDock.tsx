"use client";
// Lane B (gift from Lane A, 10-24). A compact switcher for the person's ghosts: one row of avatars, arrow keys move
// between them, the chosen one is pressed, extras fold into "+N", and an optional "+" makes a new ghost.
import { useRef, type KeyboardEvent } from "react";
import type { Ghost } from "@/lib/types";
import { rovingNext } from "./logic";
import { useLang } from "@/components/Lang";

type Props = {
  ghosts: Ghost[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  max?: number;
  lang?: "ko" | "en";
};

export function GhostDock({ ghosts, selectedId, onSelect, onCreate, max = 5, lang: langProp }: Props) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const shown = ghosts.slice(0, max);
  const hidden = ghosts.length - shown.length;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = shown.length + (onCreate ? 1 : 0);
  const move = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next = rovingNext(i, count, e.key);
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
  };
  // One tab stop for the whole row: the chosen ghost, or the first.
  const stop = Math.max(0, shown.findIndex((g) => g.id === selectedId));

  return (
    <div role="toolbar" aria-label={lang === "ko" ? "고스트" : "Ghosts"} className="flex w-fit max-w-full items-center gap-2 rounded-full border border-line bg-surface p-1.5">
      {shown.map((g, i) => {
        const on = g.id === selectedId;
        return (
          <button
            key={g.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            aria-pressed={on}
            aria-label={g.name}
            title={g.name}
            tabIndex={i === stop ? 0 : -1}
            onClick={() => onSelect(g.id)}
            onKeyDown={(e) => move(e, i)}
            className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-[15px] font-[720] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ghost ${
              on ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"
            } ${g.portraitUrl ? "" : "bg-accent-soft text-accent ring-1 ring-inset ring-accent/40"}`}
          >
            {g.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.portraitUrl} alt="" className="size-full object-cover" />
            ) : (
              g.name.slice(0, 1)
            )}
          </button>
        );
      })}
      {hidden > 0 ? (
        <span className="px-1 font-mono text-[13px] text-text-dim" aria-label={lang === "ko" ? `${hidden}명 더` : `${hidden} more`}>
          +{hidden}
        </span>
      ) : null}
      {onCreate ? (
        <button
          ref={(el) => { refs.current[shown.length] = el; }}
          type="button"
          tabIndex={shown.length === 0 ? 0 : -1}
          aria-label={lang === "ko" ? "새 고스트 만들기" : "New ghost"}
          title={lang === "ko" ? "새 고스트 만들기" : "New ghost"}
          onClick={onCreate}
          onKeyDown={(e) => move(e, shown.length)}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[20px] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ghost"
        >
          +
        </button>
      ) : null}
    </div>
  );
}
