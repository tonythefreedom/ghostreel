"use client";
// Lane B (T23). One beat of the storyboard: the scene image when one was made, else the prompt it will be made from.
// The AI label sits on every image and is never optional.
import { useState } from "react";
import type { Frame } from "@/lib/storyboard";

export function StoryboardFrame({ frame }: { frame: Frame }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(frame.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[8px] bg-surface-2">
        {frame.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={frame.image.url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col justify-end gap-1 bg-gradient-to-b from-accent/30 to-surface-2 p-3">
            <span className="text-[12px] font-semibold text-text-dim">장면 대기</span>
            <p className="line-clamp-6 font-mono text-[11px] leading-snug text-text">{frame.prompt}</p>
          </div>
        )}
        <span className="absolute left-2 top-2 whitespace-nowrap rounded-full bg-bg/80 px-1.5 py-0.5 text-[9px] font-semibold text-text">
          AI-generated · Virtual human
        </span>
        {frame.image ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-warn/20 px-2 py-0.5 text-[10px] font-semibold text-warn">미리 만든 장면</span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[12px] text-accent">{frame.t.toFixed(1)}s</span>
        <span className="text-[11px] text-text-dim">#{frame.index + 1}</span>
      </div>
      <p className="text-[13px] font-semibold leading-snug">“{frame.say}”</p>
      <p className="text-[12px] leading-snug text-text-dim">{frame.do}</p>
      <button type="button" onClick={() => void copy()}
        className="h-9 rounded-[var(--radius-card)] border border-line text-[12px] font-semibold text-text-dim">
        {copied ? "복사됨" : "장면 프롬프트 복사"}
      </button>
    </li>
  );
}
