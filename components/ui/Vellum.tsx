// Shared. Words over a picture: a frosted pane with a hairline edge, never a plate or a gradient.
import type { ReactNode } from "react";

export function Vellum({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`vellum rounded-[var(--radius-control)] px-3 py-2 ${className}`}>{children}</div>;
}

/** The AI label every ghost picture wears. Never hidden, never smaller than 12 px. */
export function AiLabel({ short = false }: { short?: boolean }) {
  return (
    <span className="vellum inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-[560]">
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {short ? "AI" : "AI-generated · Virtual human"}
    </span>
  );
}
