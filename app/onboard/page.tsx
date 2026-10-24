// Lane B (T8). Registration: the creator's background, past shorts, plans and scripts, and the virtual human.
import { cookies, headers } from "next/headers";
import { ClaudeNotice } from "@/components/ClaudeNotice";
import { OnboardForm } from "@/components/OnboardForm";
import { withFace } from "@/lib/ghostFace";
import { getLang } from "@/lib/lang";
import { publicOrigin } from "@/lib/limits";
import { listCharacters } from "@/lib/newtype";
import { currentAccount, SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { t } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const lang = await getLang();
  const [ghosts, account] = await Promise.all([
    listCharacters(),
    currentAccount((await cookies()).get(SESSION_COOKIE)?.value).catch(() => null),
  ]);
  // The site as the person sees it (the public host behind the tunnel, or localhost in dev), for the llms.txt hint.
  const site = publicOrigin(await headers(), "http://localhost:3000");
  return (
    <main className="flex min-h-dvh flex-col gap-6 pt-2">
      <header className="flex flex-col gap-2">
        <p className="text-[13px] font-[640] text-ghost">{t("obEyebrow", lang)}</p>
        <h1 className="text-[28px] font-[720] leading-tight tracking-[-0.02em]">{t("obTitle", lang)}</h1>
        <p className="text-[15px] leading-[1.5] text-text-dim">{t("obLede", lang)}</p>
      </header>
      <OnboardForm ghosts={ghosts.map(withFace)} initialAccount={account} notice={<ClaudeNotice site={site} lang={lang} />} />
    </main>
  );
}
