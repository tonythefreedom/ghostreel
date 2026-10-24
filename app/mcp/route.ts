// Lane B. GhostReel's MCP server for a person's own Claude: add it with the token from /connect. POST only (Streamable
// HTTP, JSON answers); GET has no stream to offer. The person's own Claude plan pays for the writing; a render starts
// only for a brief the person approved on the site.
import { NextResponse, type NextRequest } from "next/server";
import { summarize } from "@/lib/creatorStyle";
import { handleRpc, PROTOCOL } from "@/lib/ghostmcp/rpc";
import { allowHit, publicOrigin } from "@/lib/limits";
import { getGhost, listCharacters } from "@/lib/newtype";
import { hasLiveJob, jobFor } from "@/lib/render";
import { cameraSetups, formatPlan, reading, recipeEdit, trending } from "@/lib/shorti";
import { store } from "@/lib/store";

export const maxDuration = 60;

const PER_MINUTE = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const out = await handleRpc(
    {
      kv: store,
      getGhost,
      listGhosts: listCharacters,
      trending: async (field) => (await trending(field)).data.cards,
      job: jobFor,
      // A live render runs as the person's own CineSynth session, which only their browser holds: approving on the
      // site starts it, and Claude follows it here. A job that exists is reported; none means "start it on the site".
      render: async (brief) => {
        if (await hasLiveJob(brief.id)) return (await jobFor(brief.id)) ?? { error: "start_on_site" };
        return { error: "start_on_site" };
      },
      reading,
      recipeEdit,
      formatPlan,
      cameraSetups,
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
