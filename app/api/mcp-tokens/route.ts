// Lane B. Connect tokens for the GhostReel MCP server, for the signed-in, CineSynth-approved owner. POST shows a new
// token once; GET lists live ones by short id only; DELETE revokes one (?id=) or all.
import { NextResponse, type NextRequest } from "next/server";
import { requireSameSite } from "@/lib/guard";
import { issueToken, listTokens, revokeTokens, tokenId } from "@/lib/ghostmcp/tokens";
import { currentAccount, SESSION_COOKIE } from "@/lib/newtype/cinesynth";
import { store } from "@/lib/store";

async function owner(req: NextRequest) {
  const foreign = req.method === "GET" ? null : requireSameSite(req); // host match: behind the tunnel the server is http://localhost
  if (foreign) return { error: foreign };
  const account = await currentAccount(req.cookies.get(SESSION_COOKIE)?.value);
  if (!account) return { error: NextResponse.json({ error: "sign_in" }, { status: 401 }) };
  if (account.status !== "approved") return { error: NextResponse.json({ error: "account_pending" }, { status: 403 }) };
  return { account };
}

const view = (r: { hash: string; createdAt: string; expiresAt: string }) => ({ id: tokenId(r.hash), createdAt: r.createdAt, expiresAt: r.expiresAt });

export async function GET(req: NextRequest) {
  const { account, error } = await owner(req);
  if (error) return error;
  return NextResponse.json({ tokens: (await listTokens(store, account.id)).map(view) });
}

export async function POST(req: NextRequest) {
  const { account, error } = await owner(req);
  if (error) return error;
  const { token, record } = await issueToken(store, account);
  // The only response that ever carries the token: shown once, never stored in plain form.
  return NextResponse.json({ token, ...view(record) }, { status: 201, headers: { "cache-control": "no-store" } });
}

export async function DELETE(req: NextRequest) {
  const { account, error } = await owner(req);
  if (error) return error;
  const id = req.nextUrl.searchParams.get("id") ?? undefined;
  return NextResponse.json({ revoked: await revokeTokens(store, account.id, id) });
}
