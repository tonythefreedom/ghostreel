// Connect your own Claude to GhostReel: your Claude writes the brief (no model key on our server), GhostReel keeps it as
// a draft for you to approve. The page leads through sign-in, the token, the add step and a live check.
import { cookies, headers } from "next/headers";
import { ConnectClaude } from "@/components/ConnectClaude";
import { getLang } from "@/lib/lang";
import { publicOrigin } from "@/lib/limits";
import { currentAccount, SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const lang = await getLang();
  const account = await currentAccount((await cookies()).get(SESSION_COOKIE)?.value).catch(() => null);
  const base = publicOrigin(await headers(), "http://localhost:3000"); // the tunnel's address, not the server's own
  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-12 pt-2">
      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-[640] text-accent">{t("connectEyebrow", lang)}</p>
        <h1 className="text-[28px] font-[720] leading-[1.15] tracking-[-0.02em]">{t("connectTitle", lang)}</h1>
        <p className="text-[15px] leading-[1.5] text-text-dim">{t("connectLede", lang)}</p>
        <ol className="mt-1 grid grid-cols-3 gap-2" aria-label={t("connectHowLabel", lang)}>
          {(["connectHow1", "connectHow2", "connectHow3"] as const).map((k, i) => (
            <li key={k} className="flex flex-col gap-1.5 rounded-[var(--radius-control)] bg-surface p-3 ring-1 ring-inset ring-line">
              <span className={`font-mono text-[12px] font-[640] ${i === 2 ? "text-ghost" : i === 1 ? "text-accent" : "text-pencil"}`}>0{i + 1}</span>
              <span className="text-[12px] leading-snug text-text-dim">{t(k, lang)}</span>
            </li>
          ))}
        </ol>
      </header>
      <ConnectClaude mcpUrl={`${base}/mcp`} siteUrl={base} initialAccount={account} />
    </main>
  );
}
