"use client";
// Shared. Something to paste somewhere else (a command, a config, a sentence for your Claude): mono on a raised well,
// with one copy key that says it copied. `shown` is what the page draws when it differs from what is copied (a token
// dotted out on screen, whole in the clipboard).
import { useState } from "react";
import { useT } from "../Lang";

export function CodeBlock({ text, shown, label, wrap = true }: { text: string; shown?: string; label?: string; wrap?: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // a browser that refuses the clipboard: the text stays selectable
    }
  };
  return (
    <div className="relative rounded-[var(--radius-control)] bg-bg ring-1 ring-inset ring-line">
      {label ? <p className="px-3 pt-2.5 text-[12px] font-[560] text-text-3">{label}</p> : null}
      <pre className={`max-h-64 overflow-auto px-3 pb-3 pr-20 font-mono text-[12px] leading-relaxed text-text ${label ? "pt-1" : "pt-3"} ${wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre"}`}>
        {shown ?? text}
      </pre>
      <button type="button" onClick={() => void copy()}
        className={`absolute right-1.5 top-1.5 flex h-9 items-center gap-1 rounded-[var(--radius-control)] px-3 text-[12px] font-[640] transition-colors duration-[125ms] ${
          copied ? "bg-ghost/15 text-ghost" : "bg-surface-2 text-text hover:bg-pressed"
        }`}>
        {copied ? `✓ ${t("copied")}` : t("copy")}
      </button>
    </div>
  );
}
