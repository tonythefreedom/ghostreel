// One step of the loop on the landing: one picture or one short visual, one h2, one line.
import type { ReactNode } from "react";

export function Band({ n, title, line, children }: { n: number; title: ReactNode; line: ReactNode; children: ReactNode }) {
  const id = `band-${n}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      {children}
      <div className="flex flex-col gap-1.5">
        <h2 id={id} className="flex items-baseline gap-2 text-[22px] font-[720] tracking-[-0.02em]">
          <span className="font-mono text-[13px] font-[560] text-text-3">{String(n).padStart(2, "0")}</span>
          {title}
        </h2>
        <p className="text-[15px] leading-[1.5] text-text-dim">{line}</p>
      </div>
    </section>
  );
}
