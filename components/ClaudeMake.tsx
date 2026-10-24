"use client";
// Your own Claude makes it (Ted, 10-24: «mcp BYO로 claude opus 5.5 max등을 클로드 앱이나 터미널에서 사람들이 구독토큰을
// 써서 우리 mcp 툴들을 통해 만들 수 있도록»). One sentence for Claude, ready to send: as a Claude Code command that runs
// it on Opus 5.5 at max effort, or as the words to paste into Claude Desktop. Nothing here calls a model: the person's
// own plan pays for it, and what Claude writes comes back to GhostReel through its MCP tools.
import Link from "next/link";
import { useState } from "react";
import { CodeBlock } from "./ui";
import { useT } from "./Lang";

export type MakeKind = "write" | "revise" | "shoot";
const TITLE = { write: "cmTitleWrite", revise: "cmTitleRevise", shoot: "cmTitleShoot" } as const;

// The sentence as one shell argument: single quotes, each inner quote closed, escaped and reopened.
const shell = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export function ClaudeMake({ kind, ask, compact = false }: { kind: MakeKind; ask: string; compact?: boolean }) {
  const t = useT();
  const [host, setHost] = useState<"code" | "app">("code");
  return (
    <section className={`flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface ring-1 ring-inset ring-line ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-text font-mono text-[13px] font-[720] text-bg">✳</span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-[15px] font-[720] leading-snug">{t(TITLE[kind])}</h3>
          <p className="text-[12px] leading-snug text-text-dim">{t("cmLine")}</p>
        </div>
      </div>
      <div role="tablist" aria-label={t(TITLE[kind])} className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
        {(["code", "app"] as const).map((h) => (
          <button key={h} role="tab" type="button" aria-selected={host === h} onClick={() => setHost(h)}
            className={`h-9 rounded-full text-[13px] font-[640] transition-colors duration-[125ms] ${host === h ? "bg-text text-bg" : "text-text-dim hover:text-text"}`}>
            {t(h === "code" ? "cmCode" : "cmApp")}
          </button>
        ))}
      </div>
      {host === "code" ? (
        <CodeBlock label={t("cmCodeLabel")} text={`claude --model opus --effort max ${shell(ask)}`} />
      ) : (
        <CodeBlock label={t("cmAppLabel")} text={ask} />
      )}
      <p className="text-[12px] leading-snug text-text-3">
        {t("cmNotYet")}{" "}
        <Link href="/connect" className="font-[640] text-text-dim underline decoration-line-strong underline-offset-2 hover:text-text">
          {t("cmConnect")} →
        </Link>
      </p>
    </section>
  );
}
