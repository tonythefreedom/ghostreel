// Lane B. One virtual human to pick: monogram (portrait when NEWTYPE supplies one), name, niche, languages.
import type { Ghost } from "@/lib/types";

export function GhostCard({ ghost, selected, onSelect }: { ghost: Ghost; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-[var(--radius-card)] border bg-surface p-3 text-left ${
        selected ? "border-accent ring-2 ring-accent" : "border-line"
      }`}
    >
      {ghost.portraitUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ghost.portraitUrl} alt="" className="aspect-square w-full rounded-[8px] object-cover" />
      ) : (
        <span className="grid aspect-square w-full place-items-center rounded-[8px] bg-gradient-to-br from-accent to-surface-2 text-[32px] font-extrabold">
          {ghost.name.slice(0, 1)}
        </span>
      )}
      <span className="text-[15px] font-extrabold">{ghost.name}</span>
      <span className="text-[12px] leading-snug text-text-dim">{ghost.niche}</span>
      <span className="font-mono text-[11px] text-text-dim">{ghost.languages.map((l) => l.toUpperCase()).join(" · ")}</span>
    </button>
  );
}
