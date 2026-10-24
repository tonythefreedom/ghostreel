// Shared. DESIGN.md › Laws 2: the screen's one verb, docked at the bottom of a phone screen. Children are the buttons:
// at most one secondary, then the primary (it takes the rest of the row). `note` is one quiet line under them.
// The page keeps its last words clear of the bar with <VerbSpacer/>.
import type { ReactNode } from "react";

export function Verb({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[15] border-t border-line bg-bg/95 backdrop-blur-[16px]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-2 px-5 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 [&>*:last-child]:flex-1">{children}</div>
        {note ? <p className="text-center text-[13px] text-text-3">{note}</p> : null}
      </div>
    </div>
  );
}

export function VerbSpacer() {
  return <div aria-hidden className="h-[var(--verb-h)] shrink-0" />;
}
