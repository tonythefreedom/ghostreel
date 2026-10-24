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
      if (res.status === 409) return setError("승인된 브리프는 바꿀 수 없어요.");
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      setError("저장하지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-dim">Shorti 추천 대사</span>
      <div role="radiogroup" className="flex flex-col gap-1">
        {options.map((o) => (
          <button key={o.say} type="button" role="radio" aria-checked={o.current} disabled={locked || o.current || busy !== null}
            onClick={() => void pick(o.say)}
            className={`flex flex-col items-start gap-0.5 rounded-[8px] border px-2 py-1.5 text-left ${
              o.current ? "border-ghost bg-ghost/10" : "border-line"
            } disabled:cursor-default`}>
            <span className="text-[12px] font-semibold leading-snug">{busy === o.say ? "바꾸는 중…" : o.say}</span>
            <span className="text-[10px] leading-snug text-text-dim">
              {o.basis}
              {o.share ? <span className="text-ghost"> · {o.share}</span> : null}
            </span>
          </button>
        ))}
      </div>
      {needsUnlock ? <UnlockForm onUnlocked={() => { const say = needsUnlock; setNeedsUnlock(null); void pick(say); }} /> : null}
      {error ? <p className="text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}
