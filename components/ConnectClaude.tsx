"use client";
// Connecting your own Claude, in the order it happens: sign in with Google, make a token, add GhostReel to Claude
// (Claude Code's one command, or Claude Desktop's config), check the connection from here, then what to ask. Each step
// says when it is done. The token is shown once and lives only in this page's memory; the list below revokes any of
// them. The connection check calls the MCP server from this page with that token, so "connected" means the same
// thing it will mean for Claude.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { CinesynthAccount } from "@/lib/types";
import { shortDate } from "@/lib/words";
import { GoogleSignIn } from "./GoogleSignIn";
import { useLang, useT } from "./Lang";
import { Button, CodeBlock } from "./ui";

type Row = { id: string; createdAt: string; expiresAt: string };
// A sentence as one shell argument: single quotes, each inner quote closed, escaped and reopened.
const shell = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;
type Tool = { name: string; description?: string };
type Check = { state: "idle" | "busy" | "ok" | "fail"; tools: Tool[]; detail?: string };

export function ConnectClaude({ mcpUrl, siteUrl, initialAccount }: { mcpUrl: string; siteUrl: string; initialAccount: CinesynthAccount | null }) {
  const t = useT();
  const lang = useLang();
  const [account, setAccount] = useState(initialAccount);
  const [rows, setRows] = useState<Row[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [host, setHost] = useState<"code" | "desktop">("code");
  const [check, setCheck] = useState<Check>({ state: "idle", tools: [] });
  const approved = account?.status === "approved";

  const load = useCallback(async () => {
    const res = await fetch("/api/mcp-tokens");
    if (res.ok) setRows(((await res.json()) as { tokens: Row[] }).tokens);
  }, []);
  useEffect(() => {
    if (approved) void load();
  }, [approved, load]);
  const signedIn = useCallback((a: CinesynthAccount) => setAccount(a), []);

  async function issue() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/mcp-tokens", { method: "POST" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(res?.status === 401 ? t("connectSignInAgain") : t("connectTokenFailed"));
    setFresh(((await res.json()) as { token: string }).token);
    setReveal(false);
    setCheck({ state: "idle", tools: [] });
    void load();
  }

  async function revoke(id?: string) {
    await fetch(`/api/mcp-tokens${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "DELETE" });
    if (!id) setFresh(null);
    void load();
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setAccount(null);
    setFresh(null);
    setRows([]);
  }

  // The same calls Claude makes: initialize, then the tool list, with the token as Claude will send it.
  async function test() {
    if (!fresh) return;
    setCheck({ state: "busy", tools: [] });
    const rpc = (id: number, method: string, params: unknown) =>
      fetch("/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${fresh}` },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      });
    try {
      const init = await rpc(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "ghostreel-connect-check", version: "1" } });
      if (!init.ok) return setCheck({ state: "fail", tools: [], detail: `${init.status}` });
      const list = await rpc(2, "tools/list", {});
      const body = (await list.json()) as { result?: { tools?: Tool[] } };
      const tools = body.result?.tools ?? [];
      setCheck(tools.length ? { state: "ok", tools } : { state: "fail", tools: [], detail: `${list.status}` });
    } catch {
      setCheck({ state: "fail", tools: [], detail: "network" });
    }
  }

  const token = fresh ?? "grk_…";
  const dotted = fresh && !reveal ? `${fresh.slice(0, 8)}${"•".repeat(18)}${fresh.slice(-4)}` : token;
  const codeCmd = `claude mcp add --transport http --scope user ghostreel ${mcpUrl} --header "Authorization: Bearer ${token}"`;
  const desktop = JSON.stringify(
    { mcpServers: { ghostreel: { command: "npx", args: ["-y", "mcp-remote", mcpUrl, "--header", "Authorization:${GHOSTREEL_AUTH}"], env: { GHOSTREEL_AUTH: `Bearer ${token}` } } } },
    null,
    2,
  );
  const shownCmd = fresh ? codeCmd.replace(fresh, dotted) : codeCmd;
  const shownDesktop = fresh ? desktop.replace(fresh, dotted) : desktop;
  const date = (iso: string) => shortDate(iso, lang);

  return (
    <div className="flex flex-col gap-3">
      <Step n={1} done={approved} title={t("connectStep1")}
        line={approved ? `${account?.email}` : account ? t("connectPending") : t("connectStep1Line")}
        aside={account ? <Button kind="quiet" size="m" onClick={() => void signOut()}>{t("signOut")}</Button> : null}>
        {!account ? <GoogleSignIn onSignedIn={signedIn} /> : null}
        {account && !approved ? <p className="text-[13px] leading-snug text-warn">{t("connectPendingLine")}</p> : null}
      </Step>

      <Step n={2} done={Boolean(fresh)} locked={!approved} title={t("connectStep2")} line={fresh ? t("connectTokenOnce") : t("connectStep2Line")}>
        {approved ? (
          <div className="flex flex-col gap-2">
            {fresh ? (
              <>
                <CodeBlock text={fresh} shown={dotted} />
                <div className="flex gap-2">
                  <Button kind="quiet" size="m" onClick={() => setReveal((r) => !r)}>{reveal ? t("hide") : t("show")}</Button>
                  <Button kind="quiet" size="m" disabled={busy} onClick={() => void issue()}>{t("connectNewToken")}</Button>
                </div>
              </>
            ) : (
              <Button size="l" block disabled={busy} onClick={() => void issue()}>{busy ? t("connectMaking") : t("connectMake")}</Button>
            )}
            {error ? <p role="alert" className="text-[13px] text-danger">✕ {error}</p> : null}
          </div>
        ) : null}
      </Step>

      <Step n={3} done={check.state === "ok"} locked={!fresh} title={t("connectStep3")} line={t("connectStep3Line")}>
        {fresh ? (
          <div className="flex flex-col gap-3">
            <div role="tablist" aria-label={t("connectStep3")} className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
              {(["code", "desktop"] as const).map((h) => (
                <button key={h} role="tab" type="button" aria-selected={host === h} onClick={() => setHost(h)}
                  className={`h-9 rounded-full text-[13px] font-[640] transition-colors duration-[125ms] ${host === h ? "bg-text text-bg" : "text-text-dim"}`}>
                  {h === "code" ? "Claude Code" : "Claude Desktop"}
                </button>
              ))}
            </div>
            {host === "code" ? (
              <>
                <CodeBlock text={codeCmd} shown={shownCmd} label={t("connectRunOnce")} />
                <p className="text-[12px] leading-snug text-text-3">{t("connectCodeAfter")}</p>
              </>
            ) : (
              <>
                <CodeBlock text={desktop} shown={shownDesktop} label="claude_desktop_config.json" wrap={false} />
                <p className="text-[12px] leading-snug text-text-3">{t("connectDesktopAfter")}</p>
              </>
            )}
            <div className="flex flex-col gap-2 rounded-[var(--radius-control)] bg-surface-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-[640]">{t("connectCheck")}</p>
                <Button kind="secondary" size="m" disabled={check.state === "busy"} onClick={() => void test()}>
                  {check.state === "busy" ? t("connectChecking") : t("connectCheckGo")}
                </Button>
              </div>
              {check.state === "ok" ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[13px] font-[640] text-ghost">✓ {t("connectOk")} · {check.tools.length}</p>
                  <ul className="flex flex-col gap-1">
                    {check.tools.map((tool) => (
                      <li key={tool.name} className="flex gap-2 text-[12px] leading-snug">
                        <span className="shrink-0 font-mono text-text">{tool.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {check.state === "fail" ? (
                <p className="text-[13px] leading-snug text-danger">✕ {t("connectFail")} {check.detail === "401" ? t("connectFail401") : ""}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Step>

      <Step n={4} done={false} locked={!fresh} title={t("connectStep4")} line={t("connectStep4Line")}>
        {fresh ? (
          <div className="flex flex-col gap-2">
            <CodeBlock label={t("connectModel")} text={`claude --model opus --effort max ${shell(t("connectAsk1"))}`} />
            <p className="text-[12px] leading-snug text-text-3">{t("connectModelLine")}</p>
            <CodeBlock label={t("connectDesktopAsk")} text={t("connectAsk1")} />
            <CodeBlock label={t("loopTitle")} text={t("connectAsk2")} />
            <p className="text-[12px] leading-snug text-text-3">{t("connectAskAfter")}</p>
          </div>
        ) : null}
      </Step>

      <section className="mt-3 flex flex-col gap-2 rounded-[var(--radius-card)] bg-accent-soft p-4 ring-1 ring-inset ring-accent/30">
        <p className="text-[13px] font-[720] text-text">{t("connectSelfTitle")}</p>
        <p className="text-[13px] leading-snug text-text-dim">{t("connectSelfLine")}</p>
        <CodeBlock text={`${t("connectSelfAsk")} ${siteUrl}/llms.txt`} />
      </section>

      {approved ? (
        <section className="mt-3 flex flex-col gap-2">
          <h2 className="text-[15px] font-[720]">{t("connectLive")}</h2>
          {rows.length === 0 ? <p className="text-[13px] text-text-3">{t("connectNone")}</p> : null}
          <ul className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface px-3 py-1 ring-1 ring-inset ring-line">
                <span className="text-[12px] text-text-dim">
                  <span className="font-mono text-text">{r.id}…</span> · {t("connectUntil")} <span className="font-mono">{date(r.expiresAt)}</span>
                </span>
                <Button kind="quiet" size="m" onClick={() => void revoke(r.id)}>{t("revoke")}</Button>
              </li>
            ))}
          </ul>
          {rows.length > 1 ? <Button kind="quiet" size="m" className="self-start" onClick={() => void revoke()}>{t("revokeAll")}</Button> : null}
          <p className="text-[12px] leading-snug text-text-3">{t("connectWarn")}</p>
        </section>
      ) : null}
    </div>
  );
}

/** One step: its number (a check once done), its title and one line; its body only while it is reachable. */
function Step({ n, title, line, done, locked = false, aside, children }: {
  n: number; title: string; line: string; done: boolean; locked?: boolean; aside?: ReactNode; children?: ReactNode;
}) {
  return (
    <section className={`flex gap-3 rounded-[var(--radius-card)] p-4 ring-1 ring-inset transition-colors duration-[250ms] ${
      locked ? "bg-bg ring-line/60" : "bg-surface ring-line"
    }`} aria-current={!locked && !done ? "step" : undefined}>
      <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-[13px] font-[720] ${
        done ? "bg-ghost text-bg" : locked ? "text-text-3 ring-1 ring-inset ring-line" : "bg-text text-bg"
      }`}>
        {done ? "✓" : n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <h2 className={`text-[15px] font-[720] leading-snug ${locked ? "text-text-3" : "text-text"}`}>{title}</h2>
            <p className={`text-[13px] leading-snug ${locked ? "text-text-3" : "text-text-dim"}`}>{line}</p>
          </div>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}
