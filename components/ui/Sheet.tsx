"use client";
// Shared. A bottom sheet on a native <dialog>: focus held inside and returned on close, Esc and the scrim close it,
// the page behind is inert. It rises on the sheet spring and leaves fast. Never opened over a playing reel.
import { useEffect, useRef, type ReactNode } from "react";

export function Sheet({ open, onClose, title, children, foot }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; foot?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
      className="gr-sheet mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-[430px] rounded-t-[var(--radius-sheet)] bg-surface p-0 text-text"
    >
      <div className="flex max-h-[92dvh] flex-col px-5 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <span aria-hidden className="mx-auto mb-1 h-1 w-9 rounded-full bg-line-strong/60" />
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-[18px] font-[720] tracking-[-0.01em]">{title}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="-mr-2 grid size-11 place-items-center rounded-full text-[18px] text-text-dim hover:text-text">
            ✕
          </button>
        </div>
        <div className="-mx-5 overflow-y-auto overscroll-contain px-5 py-2">{children}</div>
        {foot ? <div className="flex gap-2 pt-3 [&>*]:flex-1">{foot}</div> : null}
      </div>
    </dialog>
  );
}
