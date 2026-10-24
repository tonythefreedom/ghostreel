"use client";
// Lane B. Pick one beat's line from the Shorti-based options; saves through the owner-only brief edit (T11).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UnlockForm } from "@/components/UnlockForm";
import type { LineOption } from "@/lib/lineSuggestions";
import type { BriefLine } from "@/lib/types";

export function LinePicker({ briefId, lines, index, options, locked }: {
  briefId: string;
  lines: BriefLine[];
  index: number;
  options: LineOption[];
  locked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [needsUnlock, setNeedsUnlock] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(say: string) {
    setBusy(say);
    setError(null);
    try {
      const next = lines.map((l, i) => (i === index ? { ...l, say } : l));
      const res = await fetch("/api/brief", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: briefId, edits: { lines: next } }),
      });
      if (res.status === 401) return setNeedsUnlock(say);
      if (res.status === 409) return setError("An approved brief can't be changed.");
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      setError("Couldn't save.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-[560] text-text-dim">Lines from Shorti</span>
      <div role="radiogroup" className="flex flex-col gap-1">
        {options.map((o) => (
          <button key={o.say} type="button" role="radio" aria-checked={o.current} disabled={locked || o.current || busy !== null}
            onClick={() => void pick(o.say)}
            className={`flex flex-col items-start gap-0.5 min-h-11 rounded-[var(--radius-pic)] border px-3 py-2 text-left ${
              o.current ? "border-text bg-surface-2" : "border-line hover:bg-surface"
            } disabled:cursor-default`}>
            <span className="text-[12px] font-[560] leading-snug">{busy === o.say ? "Changing…" : o.say}</span>
            <span className="text-[12px] leading-snug text-text-3">
              {o.basis}
              {o.share ? <span className="text-text-dim"> · {o.share}</span> : null}
            </span>
          </button>
        ))}
      </div>
      {needsUnlock ? <UnlockForm onUnlocked={() => { const say = needsUnlock; setNeedsUnlock(null); void pick(say); }} /> : null}
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}
