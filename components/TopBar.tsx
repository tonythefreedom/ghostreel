"use client";
// Lane A. The one bar on every page: the brand home on the left; on the right the way to connect your own Claude and
// the KO/EN key. It spans the window and stays at the top as the page scrolls, its contents in the page's column.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LangToggle, useT } from "./Lang";

export function TopBar() {
  const t = useT();
  const path = usePathname();
  const connect = path === "/connect";
  return (
    <header className="sticky top-0 z-30 w-full border-b border-line/60 bg-bg/88 [backdrop-filter:blur(16px)_saturate(1.3)]">
      <div className="mx-auto flex h-14 w-full max-w-[430px] items-center justify-between gap-3 px-5">
        <Link href="/" className="-ml-2 flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-2 text-[15px] font-[720] tracking-[-0.01em]">
          <span aria-hidden className="size-2.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
          {t("brand")}
        </Link>
        <nav aria-label={t("navLabel")} className="flex items-center gap-1">
          <Link href="/connect" aria-current={connect ? "page" : undefined} aria-label={t("navConnect")}
            className={`flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-[560] transition-colors duration-[125ms] ${
              connect ? "bg-accent-soft text-text" : "text-text-dim hover:text-text"
            }`}>
            <ClaudeGlyph />
            {t("navConnectShort")}
          </Link>
          <LangToggle />
        </nav>
      </div>
    </header>
  );
}

/** A plug: connect your own AI. Drawn here, never a vendor's logo. */
function ClaudeGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5" />
    </svg>
  );
}
