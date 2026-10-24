import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { OWNER_COOKIE, ownerToken, passcodeMatches } from "@/lib/guard";

const Body = z.object({ passcode: z.string().min(1).max(200) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !passcodeMatches(parsed.data.passcode)) {
    await new Promise((ok) => setTimeout(ok, 600)); // slow down guessing
    return NextResponse.json({ error: "wrong_passcode" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OWNER_COOKIE, ownerToken(env.passcode()!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 3,
  });
  return res;
}
