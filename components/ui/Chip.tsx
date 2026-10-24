"use client";
// Shared. DESIGN.md › Primitives: a 32 px pill drawn inside a 44 px target. Pressed is a white fill, never colour alone.
import type { ReactNode } from "react";

export function Chip({ on, onClick, children, count, disabled }: { on?: boolean; onClick?: () => void; children: ReactNode; count?: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 shrink-0 items-center rounded-full border-y-[6px] border-transparent bg-clip-padding px-3 text-[13px] transition-[background-color,color] duration-[125ms] active:scale-[.97] disabled:opacity-40 ${
        on ? "bg-text font-[720] text-bg" : "bg-transparent text-text ring-1 ring-inset ring-line-strong hover:bg-surface"
      }`}
      style={{ transitionTimingFunction: "var(--spring-snap)" }}
    >
      {children}
      {count != null ? <span className={`ml-1.5 font-mono text-[12px] ${on ? "text-bg/70" : "text-text-3"}`}>{count}</span> : null}
    </button>
  );
}

export function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
      {children}
    </div>
  );
}
