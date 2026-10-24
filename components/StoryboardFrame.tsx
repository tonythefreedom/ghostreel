"use client";
// Lane B (T23). One beat of the storyboard: the scene image when one was made, else the prompt it will be made from.
// The AI label sits on every image and is never optional.
import { AiLabel } from "@/components/ui";
import { useT } from "@/components/Lang";
import { useState } from "react";
import { LinePicker } from "@/components/LinePicker";
import type { LineOption } from "@/lib/lineSuggestions";
import type { Frame } from "@/lib/storyboard";
import type { BriefLine } from "@/lib/types";

export function StoryboardFrame({ frame, pick }: {
  frame: Frame;
  pick?: { briefId: string; lines: BriefLine[]; options: LineOption[]; locked: boolean };
}) {
  const t = useT();
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
    <li className="flex flex-col gap-2">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[var(--radius-pic)] bg-surface-2">
        {frame.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={frame.image.url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col justify-end gap-1 bg-surface-2 p-3">
            <span className="text-[12px] font-[560] text-text-dim">{t("sbPending")}</span>
            <p className="line-clamp-6 font-mono text-[12px] leading-snug text-text">{frame.prompt}</p>
          </div>
        )}
        <span className="absolute inset-x-2 bottom-2 flex">
          <AiLabel />
        </span>
        {frame.image ? (
          <span className="vellum absolute left-2 top-2 rounded-full px-2 py-0.5 text-[12px] font-[560] text-warn">{t("sbPremade")}</span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[12px] text-text">{frame.t.toFixed(1)}s</span>
        <span className="font-mono text-[12px] text-text-3">#{frame.index + 1}</span>
      </div>
      {pick && pick.options.length > 0 ? (
        <LinePicker briefId={pick.briefId} lines={pick.lines} index={frame.index} options={pick.options} locked={pick.locked} />
      ) : (
        <p className="text-[13px] font-[560] leading-snug">“{frame.say}”</p>
      )}
      <p className="text-[12px] leading-snug text-text-3">{frame.do}</p>
      <div className="flex gap-2">
        {frame.image ? (
          <a href={frame.image.url} download
            className="grid h-11 flex-1 place-items-center rounded-[var(--radius-control)] text-[13px] font-[560] ring-1 ring-inset ring-line-strong hover:bg-surface">
            {t("download")}
          </a>
        ) : null}
        <button type="button" onClick={() => void copy()}
          className="h-11 flex-1 rounded-[var(--radius-control)] text-[13px] font-[560] text-text-dim hover:text-text">
          {copied ? `✓ ${t("copied")}` : frame.image ? t("sbPrompt") : t("sbCopyPrompt")}
        </button>
      </div>
    </li>
  );
}
