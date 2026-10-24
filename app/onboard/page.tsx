// Lane B (T8). Registration: the creator's background, past shorts, plans and scripts, and the virtual human.
import { cookies, headers } from "next/headers";
import { ClaudeNotice } from "@/components/ClaudeNotice";
import { OnboardForm } from "@/components/OnboardForm";
import { withFace } from "@/lib/ghostFace";
import { getLang } from "@/lib/lang";
import { publicOrigin } from "@/lib/limits";
import { creatorKey, creatorsKey } from "@/lib/creator";
import { listCharacters } from "@/lib/newtype";
import { currentAccount, SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { store } from "@/lib/store";
import { Creator } from "@/lib/types";
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
  // Ted, 10-24: «프로필을 입력했는데 저장이 안되고 계속 새로 입력해야하네». A signed-in account's latest profile comes
  // back filled in, so coming back means carrying on, not typing it all again.
  const latestId = account ? (await store.list(creatorsKey(account.id)))[0] : undefined;
  const saved = latestId ? Creator.safeParse(await store.get(creatorKey(latestId))) : null;
  return (
    <main className="flex min-h-dvh flex-col gap-6 pt-2">
      <header className="flex flex-col gap-2">
        <p className="text-[13px] font-[640] text-ghost">{t("obEyebrow", lang)}</p>
        <h1 className="text-[28px] font-[720] leading-tight tracking-[-0.02em]">{t("obTitle", lang)}</h1>
        <p className="text-[15px] leading-[1.5] text-text-dim">{t("obLede", lang)}</p>
      </header>
      <OnboardForm ghosts={ghosts.map(withFace)} initialAccount={account} saved={saved?.success && saved.data.account?.id === account?.id ? saved.data : null}
        notice={<ClaudeNotice site={site} lang={lang} />} />
    </main>
  );
}
