// Lane B. The GhostReel MCP server's JSON-RPC (Streamable HTTP 2025-06-18, plain JSON answers). Every request carries
// `Authorization: Bearer grk_…`; a bad, revoked or expired token gets 401 so the client can reconnect. Three tools,
// all scoped to the token's account: list your ghosts, get a brief's prompt pack, submit a DRAFT. Pure over injected
// deps; the token never appears in an answer.
import { z } from "zod";
import { briefContext, briefSubmit, ContextArgs, ownGhosts, SubmitArgs, ToolError, type BriefDeps } from "./brief.ts";
import { verifyToken } from "./tokens.ts";

export const PROTOCOL = "2025-06-18";
const SERVER = { name: "ghostreel", version: "0.1.0" };

export interface RpcDeps extends BriefDeps {
  allow(key: string): boolean; // per-token rate limit
  origin: string;
  now?: Date;
}

const Req = z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number()]).optional(), method: z.string(), params: z.unknown().optional() });

const TOOLS = [
  {
    name: "ghostreel_ghosts",
    description: "List your GhostReel ghosts and the shorts you kept for each on the taste deck. Use a ghostId and videoId from here.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ghostreel_brief_context",
    description:
      "Get everything to write a ghost's next brief yourself: the system rules, the data (ghost, your style, Shorti's reading of the kept short) and the JSON shape of the answer. Then call ghostreel_brief_submit.",
    inputSchema: z.toJSONSchema(ContextArgs),
  },
  {
    name: "ghostreel_brief_submit",
    description:
      "Save the brief you wrote as a DRAFT in GhostReel (it does not approve or render). Pass the same ghostId, videoId, intent and spot, and your answer as `draft`.",
    inputSchema: z.toJSONSchema(SubmitArgs.extend({ draft: z.record(z.string(), z.unknown()) })),
  },
];

type Out = { status: number; body: unknown };
const ok = (id: unknown, result: unknown): Out => ({ status: 200, body: { jsonrpc: "2.0", id, result } });
const fail = (status: number, id: unknown, code: number, message: string): Out => ({ status, body: { jsonrpc: "2.0", id: id ?? null, error: { code, message } } });
const text = (value: unknown, isError = false) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value, isError });

export async function handleRpc(deps: RpcDeps, authorization: string | null, raw: unknown): Promise<Out> {
  const presented = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  const token = await verifyToken(deps.kv, presented, deps.now);
  if (!token) return fail(401, null, -32001, "Unauthorized: connect again from GhostReel's Connect your Claude page.");
  if (!deps.allow(`mcp:${token.hash}`)) return fail(429, null, -32002, "Too many calls; wait a minute.");

  const parsed = Req.safeParse(raw);
  if (!parsed.success) return fail(400, null, -32600, "Invalid request");
  const { id, method, params } = parsed.data;
  if (id === undefined) return { status: 202, body: null }; // a notification (e.g. notifications/initialized)

  switch (method) {
    case "initialize":
      return ok(id, { protocolVersion: PROTOCOL, capabilities: { tools: {} }, serverInfo: SERVER });
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const call = z.object({ name: z.string(), arguments: z.unknown().optional() }).safeParse(params);
      if (!call.success) return fail(400, id, -32602, "Invalid params");
      try {
        if (call.data.name === "ghostreel_ghosts") return ok(id, text({ ghosts: await ownGhosts(deps, token.accountId) }));
        if (call.data.name === "ghostreel_brief_context") return ok(id, text(await briefContext(deps, token.accountId, call.data.arguments ?? {})));
        if (call.data.name === "ghostreel_brief_submit") return ok(id, text(await briefSubmit(deps, token.accountId, call.data.arguments ?? {}, deps.origin)));
        return fail(400, id, -32602, `Unknown tool: ${call.data.name}`);
      } catch (e) {
        if (e instanceof ToolError) return ok(id, text({ error: e.code, message: e.message }, true));
        if (e instanceof z.ZodError) return ok(id, text({ error: "bad_arguments", message: e.issues[0]?.message ?? "invalid" }, true));
        return ok(id, text({ error: "failed", message: "Something went wrong; try again." }, true));
      }
    }
    default:
      return fail(404, id, -32601, `Method not found: ${method}`);
  }
}
