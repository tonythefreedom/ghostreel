// Lane B. A finished live render's video or its opening frame, saved on this server when the render finished (no
// CineSynth session is needed to watch it). Addressed by the job's UUID only; byte ranges so the player can seek.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { renderFile } from "@/lib/newtype/live";

export async function GET(req: NextRequest) {
  const id = z.string().uuid().safeParse(req.nextUrl.searchParams.get("id"));
  if (!id.success) return NextResponse.json({ error: "bad_id" }, { status: 400 });
  const kind = req.nextUrl.searchParams.get("kind") === "poster" ? "poster" : "video";
  const path = renderFile(id.data, kind);
  const info = await stat(path).catch(() => null);
  if (!info) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const type = kind === "video" ? "video/mp4" : "image/png";
  const headers: Record<string, string> = { "content-type": type, "accept-ranges": "bytes", "cache-control": "public, max-age=3600" };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${info.size}` } });
    const body = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
    return new NextResponse(body, { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${info.size}`, "content-length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new NextResponse(body, { headers: { ...headers, "content-length": String(info.size) } });
}
