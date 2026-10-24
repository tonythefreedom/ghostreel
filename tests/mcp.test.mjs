// Review 2026-10-24, issues 3 and 4 and the Streamable HTTP recovery rules, against a fake MCP server.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { callTool, parseSse, resetSessions } from "../lib/mcp.ts";

test("issue 3: SSE events end at a blank line; data lines join; comments and CRLF are handled", () => {
  const body = ": keep-alive\r\nevent: message\r\ndata: {\"jsonrpc\":\"2.0\",\r\ndata: \"id\":7,\"result\":{\"ok\":true}}\r\n\r\ndata: {\"jsonrpc\":\"2.0\",\"method\":\"notifications/progress\"}\n\n";
  assert.deepEqual(parseSse(body), [
    { jsonrpc: "2.0", id: 7, result: { ok: true } },
    { jsonrpc: "2.0", method: "notifications/progress" },
  ]);
});

// A server that issues sessions, expires the first one once, and answers tools/call over SSE with a trailing notification.
let server, url;
let expireNext = false;
const seen = { initialize: 0, sessions: [], protocol: [] };
before(async () => {
  server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const msg = JSON.parse(raw);
    const sid = req.headers["mcp-session-id"];
    if (msg.method === "initialize") {
      seen.initialize++;
      await new Promise((ok) => setTimeout(ok, 20));
      res.writeHead(200, { "content-type": "application/json", "mcp-session-id": `s${seen.initialize}` });
      return res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "fake", version: "1" } } }));
    }
    if (msg.method === "notifications/initialized") return res.writeHead(202).end();
    seen.sessions.push(sid);
    seen.protocol.push(req.headers["mcp-protocol-version"]);
    if (expireNext && sid === `s${seen.initialize}`) {
      expireNext = false;
      return res.writeHead(404).end("session not found");
    }
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end(
      `data: {"jsonrpc":"2.0","method":"notifications/message","params":{}}\n\n` +
        `data: {"jsonrpc":"2.0","id":${msg.id},"result":{"structuredContent":{"echo":${JSON.stringify(msg.params.arguments)}},"content":[{"type":"text","text":"ok"}]}}\n\n` +
        `data: {"jsonrpc":"2.0","method":"notifications/progress","params":{}}\n\n`,
    );
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  url = `http://127.0.0.1:${server.address().port}/mcp`;
  resetSessions();
});
after(() => server.close());

test("concurrent first calls share one initialize; issue 3: the response is picked by id, not the last event", async () => {
  const results = await Promise.all([1, 2, 3].map((n) => callTool(url, "t", { n })));
  assert.equal(seen.initialize, 1, "one initialize for three concurrent calls");
  assert.deepEqual(results.map((r) => r.structured.echo.n).sort(), [1, 2, 3]);
  assert.ok(seen.protocol.every((p) => p === "2025-06-18"), "MCP-Protocol-Version on every call after initialize");
});

test("issue 4: a 404 on a session re-initializes once and retries with the new session", async () => {
  expireNext = true;
  const r = await callTool(url, "t", { n: 9 });
  assert.equal(r.structured.echo.n, 9);
  assert.equal(seen.initialize, 2, "re-initialized after the 404");
  assert.equal(seen.sessions.at(-1), "s2");
});
