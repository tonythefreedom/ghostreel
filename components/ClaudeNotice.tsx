// Lane B. Under onboarding's sign-in: GhostReel works with your own Claude. Your Claude can read /llms.txt and set up
// the MCP connection itself; the one thing it needs from you is a token from /connect after sign-in.
import Link from "next/link";
import { t, type UiLang } from "@/lib/words";

export function ClaudeNotice({ site, lang }: { site: string; lang: UiLang }) {
  return (
    <aside aria-label={t("noticeTitle", lang)} className="mt-2 flex flex-col gap-1.5 rounded-[var(--radius-card)] bg-accent-soft p-4 ring-1 ring-inset ring-accent/30">
      <p className="text-[13px] font-[720] text-text">{t("noticeTitle", lang)}</p>
      <p className="text-[13px] leading-snug text-text-dim">
        {t("noticeLine", lang)}{" "}
        <Link href="/connect" className="font-[640] text-text underline decoration-accent/60 underline-offset-2">{t("navConnect", lang)} →</Link>
      </p>
      <p className="text-[12px] leading-snug text-text-3">
        {t("noticeSelf", lang)} <span className="font-mono text-text-dim [overflow-wrap:anywhere]">{site}/llms.txt</span>
      </p>
    </aside>
  );
}
