// Shared. A wait shown as its steps: ✓ done (green), ● now, ○ next; each may carry a figure ("2 / 4", "0:12").
import type { ReactNode } from "react";

export type Step = { label: ReactNode; state: "done" | "now" | "next"; figure?: ReactNode };

export function Progress({ steps, label }: { steps: Step[]; label?: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {steps.map((s, i) => (
        <li key={i} aria-current={s.state === "now" ? "step" : undefined}
          className="flex min-h-11 items-center gap-3 border-b border-line text-[15px] last:border-b-0">
          <span aria-hidden className={`w-4 text-center ${s.state === "done" ? "text-ghost" : s.state === "now" ? "text-text" : "text-text-3"}`}>
            {s.state === "done" ? "✓" : s.state === "now" ? "●" : "○"}
          </span>
          <span className={`flex-1 ${s.state === "now" ? "font-[560] text-text" : s.state === "done" ? "text-text-dim" : "text-text-3"}`}>{s.label}</span>
          {s.figure != null ? <span className="font-mono text-[13px] text-text-3">{s.figure}</span> : null}
        </li>
      ))}
    </ol>
  );
}
