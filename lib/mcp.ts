// Minimal MCP client over streamable HTTP: one JSON-RPC POST per tool call.
// Handles a plain JSON body or an SSE body, and an optional session id. Drops `_meta` (UI views) on the floor.

export interface ToolResult {
  structured: unknown;
  text: string;
  isError: boolean;
}

interface RpcEnvelope {
  result?: {
    structuredContent?: unknown;
    content?: Array<{ type: string; text?: string }>;
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

const PROTOCOL = "2025-06-18";
const sessions = new Map<string, string | null>();

async function post(url: string, body: object, session: string | null, timeoutMs: number) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (session) headers["mcp-session-id"] = session;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok && res.status !== 202) throw new Error(`mcp ${new URL(url).host}: HTTP ${res.status}`);
  return res;
}

function parseBody(raw: string): RpcEnvelope {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed) as RpcEnvelope;
  // SSE: the last `data:` line that parses as a JSON-RPC response wins.
  const lines = trimmed.split("\n").filter((l) => l.startsWith("data:"));
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]!.slice(5).trim()) as RpcEnvelope;
    } catch {
      continue;
    }
  }
  throw new Error("mcp: empty or unreadable response body");
}

async function open(url: string, timeoutMs: number): Promise<string | null> {
  if (sessions.has(url)) return sessions.get(url) ?? null;
  const res = await post(
    url,
    {
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: "ghostreel", version: "0.1" } },
    },
    null,
    timeoutMs,
  );
  const session = res.headers.get("mcp-session-id");
  await res.text();
  await (await post(url, { jsonrpc: "2.0", method: "notifications/initialized" }, session, timeoutMs)).text();
  sessions.set(url, session);
  return session;
}

export async function callTool(
  url: string,
  name: string,
  args: Record<string, unknown>,
  { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
): Promise<ToolResult> {
  const session = await open(url, timeoutMs);
  const res = await post(
    url,
    { jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } },
    session,
    timeoutMs,
  );
  const env = parseBody(await res.text());
  if (env.error) throw new Error(`mcp ${name}: ${env.error.message}`);
  const result = env.result ?? {};
  return {
    structured: result.structuredContent ?? null,
    text: (result.content ?? []).map((c) => c.text ?? "").join("\n"),
    isError: result.isError === true,
  };
}
