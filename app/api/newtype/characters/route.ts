// Lane A (for Lane B's roster). The signed-in user's CineSynth characters for onboarding's "who performs": their
// names, whether each is complete, and a thumbnail link back through here (CineSynth needs the session, the browser
// never holds it). `?thumb=<name>` streams that thumbnail.
import { NextResponse, type NextRequest } from "next/server";
import { accountCharacters, characterThumb, CinesynthAuthError, SESSION_COOKIE } from "@/lib/newtype/cinesynth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "sign_in" }, { status: 401 });
  const thumb = req.nextUrl.searchParams.get("thumb");
  try {
    if (thumb) {
      const upstream = await characterThumb(thumb, token);
      return new NextResponse(upstream.body, {
        headers: { "content-type": upstream.headers.get("content-type") ?? "image/jpeg", "cache-control": "private, max-age=600" },
      });
    }
    const characters = (await accountCharacters(token)).map((c) => ({
      name: c.name,
      complete: c.complete,
      thumb: c.thumbnail ? `/api/newtype/characters?thumb=${encodeURIComponent(c.name)}` : null,
    }));
    return NextResponse.json({ characters }, { headers: { "cache-control": "private, no-store" } });
  } catch (e) {
    const status = e instanceof CinesynthAuthError ? e.status : 502;
    return NextResponse.json({ error: "characters_failed" }, { status: status === 401 ? 401 : status === 404 ? 404 : 502 });
  }
}
