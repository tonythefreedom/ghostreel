// Lane B. Connect your own Claude to GhostReel: your Claude writes the brief (no model key on our server), GhostReel
// keeps it as a draft for you to approve.
import { cookies } from "next/headers";
import { ConnectClaude } from "@/components/ConnectClaude";
import { ButtonLink } from "@/components/ui";
import { currentAccount, SESSION_COOKIE } from "@/lib/newtype/cinesynth";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const account = await currentAccount((await cookies()).get(SESSION_COOKIE)?.value);
  const base = process.env.GHOSTREEL_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
  return (
    <main className="flex min-h-dvh flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-[560] text-text-dim">
          <span aria-hidden className="size-2 rounded-full bg-accent" />
          GhostReel · Connect your Claude
        </div>
        <h1 className="text-[28px] font-[720] leading-tight tracking-[-0.02em]">Your Claude writes the brief</h1>
        <p className="text-[15px] text-text-dim">
          Add GhostReel to Claude Code or Claude Desktop. Your Claude reads your ghost, your style and Shorti&apos;s
          reading of the short you kept, writes the brief, and saves it here as a draft. Approving and rendering stay
          with you on this site.
        </p>
      </header>
      {account?.status === "approved" ? (
        <ConnectClaude mcpUrl={`${base}/mcp`} />
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-[13px] text-text-dim">
            {account ? "CineSynth hasn't approved this account yet." : "Sign in with Google first; the token is tied to that account."}
          </p>
          <ButtonLink size="xl" block href="/onboard">Sign in</ButtonLink>
        </section>
      )}
    </main>
  );
}
