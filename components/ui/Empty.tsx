// Shared. Nothing here yet: a head, one line, one quiet way forward. Never "coming soon".
import type { ReactNode } from "react";

export function Empty({ head, line, action }: { head: ReactNode; line?: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line-strong/60 px-5 py-10 text-center">
      <p className="text-[15px] font-[560]">{head}</p>
      {line ? <p className="text-[13px] text-text-dim">{line}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
