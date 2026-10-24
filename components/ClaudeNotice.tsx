// Lane B. The notice at the top of onboarding: GhostReel works with your own Claude. Your Claude can read /llms.txt
// and set up the MCP connection itself; the one thing it needs from you is a token from /connect after sign-in.
import Link from "next/link";

export function ClaudeNotice({ host }: { host: string }) {
  return (
    <aside aria-label="Use GhostReel with your Claude" className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-accent-soft p-4 ring-1 ring-inset ring-accent/40">
      <p className="text-[13px] font-[720] text-accent">Works with your own Claude</p>
      <p className="text-[13px] leading-snug text-text">
        Your Claude writes your ghost&apos;s briefs through GhostReel&apos;s MCP server. No model key on our side. Sign in
        below, then get a token at <Link href="/connect" className="underline decoration-accent/60 underline-offset-2">Connect</Link>.
      </p>
      <p className="text-[12px] leading-snug text-text-dim">
        Tell Claude Code: &ldquo;Read{" "}
        <a href="/llms.txt" className="font-mono text-text underline decoration-line underline-offset-2">{host}/llms.txt</a>{" "}
        and connect GhostReel.&rdquo; It sets everything up and asks you only for the token.
      </p>
    </aside>
  );
}
