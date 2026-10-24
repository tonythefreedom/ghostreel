// Shared. Words over a picture: a frosted pane with a hairline edge, never a plate or a gradient.
import type { ReactNode } from "react";

export function Vellum({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`vellum rounded-[var(--radius-control)] px-3 py-2 ${className}`}>{children}</div>;
}

/** The AI label every ghost picture wears, always in full. Never hidden, never smaller than 12 px. */
export function AiLabel() {
  return (
    <span className="vellum inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] px-2 py-1 text-[12px] leading-tight font-[560] [text-wrap:balance]">
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      AI-generated · Virtual human
    </span>
  );
}
