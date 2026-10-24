// Lane B. Streams one of the signed-in user's own CineSynth results (a result link from a job or MCP answer) using
// their CineSynth session, so a result opens without a CineSynth web sign-in. Only CineSynth result links pass.
import { NextResponse, type NextRequest } from "next/server";
import { CinesynthAuthError, fetchMedia, SESSION_COOKIE } from "@/lib/newtype/cinesynth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "sign_in" }, { status: 401 });
  const url = req.nextUrl.searchParams.get("url") ?? "";
  try {
    const upstream = await fetchMedia(url, token);
    return new NextResponse(upstream.body, {
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "cache-control": "private, no-store",
      },
    });
  } catch (e) {
    const status = e instanceof CinesynthAuthError ? e.status : 502;
    return NextResponse.json({ error: "media_failed" }, { status: status === 400 ? 400 : status === 401 || status === 404 ? 404 : 502 });
  }
}
