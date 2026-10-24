"use client";
// Lane B. "Connect your Claude": issue a GhostReel MCP token (shown once), copy the add command, revoke tokens.
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

type Row = { id: string; createdAt: string; expiresAt: string };

export function ConnectClaude({ mcpUrl }: { mcpUrl: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/mcp-tokens");
    if (res.ok) setRows(((await res.json()) as { tokens: Row[] }).tokens);
  }, []);
  useEffect(() => void load(), [load]);

  const command = fresh ? `claude mcp add --transport http ghostreel ${mcpUrl} --header "Authorization: Bearer ${fresh}"` : "";

  async function issue() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/mcp-tokens", { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't make a token. Sign in again.");
    setFresh(((await res.json()) as { token: string }).token);
    void load();
  }

  async function revoke(id?: string) {
    await fetch(`/api/mcp-tokens${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "DELETE" });
    setFresh(null);
    void load();
  }

  return (
    <div className="flex flex-col gap-5">
      <Button size="xl" block disabled={busy} onClick={() => void issue()}>{busy ? "Making…" : "Make a connect token"}</Button>
      {error ? <p role="alert" className="text-[13px] text-danger">{error}</p> : null}

      {fresh ? (
        <section className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface-2 p-3 ring-1 ring-inset ring-line">
          <p className="text-[13px] font-[560]">Run this once in a terminal. The token is shown only now.</p>
          <pre className="whitespace-pre-wrap break-all rounded-[var(--radius-control)] bg-bg p-2 font-mono text-[12px]">{command}</pre>
          <Button kind="quiet" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? "Copied" : "Copy command"}
          </Button>
          <p className="text-[12px] text-text-dim">
            Then ask your Claude: &ldquo;List my GhostReel ghosts and write the next brief.&rdquo; It saves a draft; you approve it here.
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-[720]">Live tokens</h2>
        {rows.length === 0 ? <p className="text-[13px] text-text-dim">None yet.</p> : null}
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface-2 px-3 py-2 ring-1 ring-inset ring-line">
              <span className="font-mono text-[12px]">{r.id}… · until {new Date(r.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <Button kind="quiet" onClick={() => void revoke(r.id)}>Revoke</Button>
            </li>
          ))}
        </ul>
        {rows.length > 1 ? <Button kind="quiet" onClick={() => void revoke()}>Revoke all</Button> : null}
        <p className="text-[12px] text-warn">
          The add command leaves the token in your shell history and your Claude config. Revoke it here if either is
          shared or the machine isn&apos;t yours. Tokens expire after 7 days and on sign-out.
        </p>
      </section>
    </div>
  );
}
