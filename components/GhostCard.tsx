// Lane B. One virtual human to pick: its picture (the signed-in account's CineSynth character when it has one, else
// the ghost's own CineSynth keyframe, else its monogram) with the AI label, its name, niche and languages, and whether
// CineSynth has its character ready to perform.
import { AiLabel } from "@/components/ui";
import type { Ghost } from "@/lib/types";

export type CastState = "ready" | "incomplete" | "missing" | "unknown";

export function GhostCard({ ghost, picture, cast = "unknown", castWord, selected, onSelect }: {
  ghost: Ghost;
  picture?: string | null;
  cast?: CastState;
  castWord?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const src = picture ?? ghost.portraitUrl;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex flex-col items-start gap-2 rounded-[var(--radius-card)] bg-surface p-2.5 text-left ring-inset transition-[box-shadow,background-color] duration-[125ms] ${
        selected ? "ring-2 ring-accent" : "ring-1 ring-line hover:bg-surface-2"
      }`}
    >
      {src ? (
        <span className="@container relative block aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-pic)] bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="size-full object-cover object-[50%_18%]" />
          <span className="absolute inset-x-1.5 bottom-1.5 flex"><AiLabel /></span>
        </span>
      ) : (
        <span className="grid aspect-[4/5] w-full place-items-center rounded-[var(--radius-pic)] bg-accent-soft text-[32px] font-[720] text-accent ring-1 ring-inset ring-accent/40">
          {ghost.name.slice(0, 1)}
        </span>
      )}
      {selected ? (
        <span aria-hidden className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-accent text-[13px] font-[720] text-white">✓</span>
      ) : null}
      <span className="flex w-full items-baseline justify-between gap-2 px-0.5">
        <span className="text-[15px] font-[720]">{ghost.name}</span>
        <span className="font-mono text-[11px] text-text-3">{ghost.languages.map((l) => l.toUpperCase()).join("·")}</span>
      </span>
      <span className="px-0.5 text-[12px] leading-snug text-text-dim">{ghost.niche}</span>
      {castWord ? (
        <span className={`px-0.5 text-[11px] font-[640] ${cast === "ready" ? "text-ghost" : cast === "unknown" ? "text-text-3" : "text-warn"}`}>
          {cast === "ready" ? "✓ " : ""}{castWord}
        </span>
      ) : null}
    </button>
  );
}
