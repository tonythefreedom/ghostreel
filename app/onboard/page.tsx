// Lane B (T8). Registration: the creator's background, past shorts, plans and scripts, and the virtual human.
import { cookies, headers } from "next/headers";
import { ClaudeNotice } from "@/components/ClaudeNotice";
import { OnboardForm } from "@/components/OnboardForm";
import { listCharacters } from "@/lib/newtype";
import { currentAccount, SESSION_COOKIE } from "@/lib/newtype/cinesynth";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const [ghosts, account] = await Promise.all([
    listCharacters(),
    currentAccount((await cookies()).get(SESSION_COOKIE)?.value),
  ]);
  // The site as the person sees it (the public host behind the tunnel, or localhost in dev), for the llms.txt hint.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "this site";
  return (
    <main className="flex min-h-dvh flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-[560] text-text-dim">
          <span className="inline-block size-2 rounded-full bg-ghost" aria-hidden />
          GhostReel · Sign up
        </div>
        <h1 className="text-[28px] font-[720] leading-tight tracking-[-0.02em]">Tell us about your work, once</h1>
        <p className="text-[15px] text-text-dim">
          We read the shorts and plans you've made, learn your style, and a virtual human makes a new short in it every day, ready to schedule.
        </p>
      </header>
      <ClaudeNotice host={host} />
      <OnboardForm ghosts={ghosts} initialAccount={account} />
    </main>
  );
}
