// Minimal MCP client over Streamable HTTP (spec 2025-06-18), enough for read-only tool calls.
// - initialize once per server URL (concurrent callers share it), validate the result, send notifications/initialized;
// - send Mcp-Session-Id (when the server issued one) and MCP-Protocol-Version on every later request;
// - a 404 on a session, or a 400 about the session, drops it and re-initializes once;
// - read a JSON or an SSE body and pick the JSON-RPC response whose id matches the request.
// It never retries a tool call by itself: callers decide, and only read-only tools may be retried after a timeout.

export interface ToolResult {
  structured: unknown;
  text: string;
  isError: boolean;
}

interface RpcMessage {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  result?: {
    structuredContent?: unknown;
    content?: Array<{ type: string; text?: string }>;
    isError?: boolean;
    protocolVersion?: unknown;
    capabilities?: unknown;
    serverInfo?: unknown;
  };
  error?: { code: number; message: string };
}

interface Session {
  id: string | null;
  protocol: string;
}

const PROTOCOL = "2025-06-18";
const sessions = new Map<string, Promise<Session>>();
let nextId = 1;

/** Test hook: forget every session. */
export function resetSessions() {
  sessions.clear();
}

/** SSE body → parsed JSON of each event's data. Events end at a blank line; data lines join with "\n". */
export function parseSse(body: string): unknown[] {
  const out: unknown[] = [];
  let data: string[] = [];
  const flush = () => {
    if (data.length) {
      try {
        out.push(JSON.parse(data.join("\n")));
      } catch {
        // not JSON: not a JSON-RPC message
      }
    }
    data = [];
  };
  for (const line of body.split(/\r\n|\r|\n/)) {
    if (line === "") flush();
    else if (line.startsWith(":")) continue; // comment
    else if (line.startsWith("data:")) data.push(line.slice(line.startsWith("data: ") ? 6 : 5));
  }
  flush();
  return out;
}

async function readResponse(res: Response, id: number): Promise<RpcMessage> {
  const type = res.headers.get("content-type") ?? "";
  const raw = await res.text();
  const messages: unknown[] = type.includes("text/event-stream") ? parseSse(raw) : [JSON.parse(raw)].flat();
  const reply = messages.find(
    (m): m is RpcMessage => typeof m === "object" && m !== null && (m as RpcMessage).id === id && ("result" in m || "error" in m),
  );
  if (!reply) throw new Error(`mcp: no response for request ${id}`);
  return reply;
}

function post(url: string, body: object, session: Session | null, timeoutMs: number) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (session?.id) headers["mcp-session-id"] = session.id;
  if (session) headers["mcp-protocol-version"] = session.protocol;
  return fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
}

async function initialize(url: string, timeoutMs: number): Promise<Session> {
  const id = nextId++;
  const res = await post(
    url,
    { jsonrpc: "2.0", id, method: "initialize", params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: "ghostreel", version: "0.1" } } },
    null,
    timeoutMs,
  );
  if (!res.ok) throw new Error(`mcp ${new URL(url).host}: initialize HTTP ${res.status}`);
  const reply = await readResponse(res, id);
  const r = reply.result;
  if (reply.error || typeof r?.protocolVersion !== "string" || typeof r.capabilities !== "object" || typeof r.serverInfo !== "object") {
    throw new Error(`mcp ${new URL(url).host}: invalid InitializeResult`);
  }
  const session: Session = { id: res.headers.get("mcp-session-id"), protocol: r.protocolVersion };
  const ack = await post(url, { jsonrpc: "2.0", method: "notifications/initialized" }, session, timeoutMs);
  await ack.text();
  return session;
}

function open(url: string, timeoutMs: number): Promise<Session> {
  let pending = sessions.get(url);
  if (!pending) {
    pending = initialize(url, timeoutMs);
    sessions.set(url, pending);
    pending.catch(() => sessions.get(url) === pending && sessions.delete(url));
  }
  return pending;
}

function forget(url: string, stale: Promise<Session>) {
  if (sessions.get(url) === stale) sessions.delete(url);
}

export async function callTool(
  url: string,
  name: string,
  args: Record<string, unknown>,
  { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
): Promise<ToolResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const pending = open(url, timeoutMs);
    const session = await pending;
    const id = nextId++;
    const res = await post(url, { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }, session, timeoutMs);
    if (res.status === 404 && session.id) {
      await res.text();
      forget(url, pending); // the server ended this session: start a new one and try once more
      continue;
    }
    if (res.status === 400) {
      const text = await res.text();
      if (/session/i.test(text) && attempt === 0) {
        forget(url, pending);
        continue;
      }
      throw new Error(`mcp ${name}: HTTP 400`);
    }
    if (!res.ok) throw new Error(`mcp ${name}: HTTP ${res.status}`);
    const reply = await readResponse(res, id);
    if (reply.error) throw new Error(`mcp ${name}: ${reply.error.message}`);
    const result = reply.result ?? {};
    return {
      structured: result.structuredContent ?? null,
      text: (result.content ?? []).map((c) => c.text ?? "").join("\n"),
      isError: result.isError === true,
    };
  }
  throw new Error(`mcp ${name}: session could not be re-established`);
}
