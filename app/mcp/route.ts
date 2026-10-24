// Lane B. GhostReel's MCP server for a person's own Claude: add it with the token from /connect. POST only (Streamable
// HTTP, JSON answers); GET has no stream to offer.
import { NextResponse, type NextRequest } from "next/server";
import { summarize } from "@/lib/creatorStyle";
import { handleRpc, PROTOCOL } from "@/lib/ghostmcp/rpc";
import { allowHit, publicOrigin } from "@/lib/limits";
import { getGhost } from "@/lib/newtype";
import { formatPlan, reading, recipeEdit } from "@/lib/shorti";
import { store } from "@/lib/store";

export const maxDuration = 60;

const PER_MINUTE = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const out = await handleRpc(
    {
      kv: store,
      getGhost,
      reading,
      recipeEdit,
      formatPlan,
      creatorStyle: async (c) => {
        if (!c.works.length) return undefined;
        const s = summarize(await Promise.all(c.works.map(async (url) => ({ url, reading: await reading(url, url), recipe: await recipeEdit(url) }))));
        return s.read ? { hooks: s.hooks, moves: s.moves.map((m) => ({ cue: m.cue, do: m.do })), makeItYours: s.makeItYours, bpm: s.bpm, lengthSec: s.lengthSec } : undefined;
      },
      allow: (key) => allowHit(key, PER_MINUTE, 60_000),
      origin: publicOrigin(req.headers, req.nextUrl.origin),
    },
    req.headers.get("authorization"),
    body,
  );
  const headers = { "mcp-protocol-version": PROTOCOL, ...(out.status === 401 ? { "www-authenticate": 'Bearer realm="ghostreel"' } : {}) };
  if (out.body === null) return new NextResponse(null, { status: out.status, headers });
  return NextResponse.json(out.body, { status: out.status, headers });
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}

export function DELETE() {
  return new NextResponse(null, { status: 204 });
}
