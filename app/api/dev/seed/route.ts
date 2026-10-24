// Development only (404 in any build): seeds one kept pick and a draft brief from the recorded Shorti fixture,
// so the edit → approve → render flow can be exercised without a model key. The brief is marked "[dev]". It also
// seeds a dev account with an MCP token (the loop, locally) and makes this browser the operator.
import { NextResponse } from "next/server";
import { finishBrief } from "@/lib/brief";
import { creatorKey, creatorsKey, tasteKey } from "@/lib/creator";
import { env } from "@/lib/env";
import { issueToken } from "@/lib/ghostmcp/tokens";
import { OWNER_COOKIE, ownerToken } from "@/lib/guard";
import { getGhost } from "@/lib/newtype";
import { store } from "@/lib/store";
import beauty from "@/fixtures/shorti/trending-beauty.json";

export async function POST() {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "not_found" }, { status: 404 });
  const ghost = (await getGhost("yuna"))!;
  const card = beauty.cards.find((c) => c.formatKind === "format") ?? beauty.cards[0]!;
  await store.set(`taste:${ghost.id}`, [
    { ghostId: ghost.id, videoId: card.videoId, url: card.url, formatId: card.formatId, kept: true, keep: ["hook", "beat"], at: new Date().toISOString() },
  ]);
  const brief = finishBrief(
    { ghost, videoId: card.videoId, formatId: card.formatId, intent: "adapt" },
    {
      durationSec: 10,
      hook: "[dev] 0% to ready in ten seconds",
      lines: [
        { t: 0, say: "Zero percent. Watch this.", do: "Close-up, bare face, a 0% counter floats above her head" },
        { t: 3, say: "Skin first.", do: "Quick cuts on the beat: cushion, brows, counter jumps to 40%" },
        { t: 6.5, say: "Almost…", do: "Lip tint, counter at 90%, she glances at camera" },
        { t: 9, say: "Done.", do: "Snap to full glam, counter hits 100%, small wave" },
      ],
      outfit: "Cream cable-knit cardigan",
      scene: "Bright vanity by a window, phone on a tripod slightly above eye level",
      caption: "Ten seconds, one look. What percent are you at today?",
      hashtags: ["grwm", "kbeauty", "makeuptransformation"],
      twist: "",
      ko: {
        hook: "[dev] 10초 만에 0%에서 완성까지",
        lines: [
          { say: "0퍼센트. 잘 봐.", do: "클로즈업, 민낯, 머리 위에 0% 카운터" },
          { say: "피부 먼저.", do: "비트에 맞춘 빠른 컷: 쿠션, 눈썹, 카운터 40%로" },
          { say: "거의 다…", do: "립 틴트, 카운터 90%, 카메라를 힐끗" },
          { say: "끝.", do: "풀메로 스냅, 카운터 100%, 작게 손 인사" },
        ],
        outfit: "크림색 케이블 니트 카디건",
        scene: "창가의 밝은 화장대, 눈높이보다 살짝 위 삼각대의 폰",
        caption: "10초, 한 가지 룩. 오늘 몇 퍼센트예요?",
      },
    },
  );
  await store.set(`brief:${brief.id}`, brief, 60 * 60 * 24);
  await store.push(`briefs:${ghost.id}`, brief.id, 50, 60 * 60 * 24); // so the channel lists it
  // A dev account with this ghost and an MCP token, so the loop (/mcp get → revise) runs locally without Google.
  const dev = { id: 999_999, email: "dev@localhost.test" };
  await store.set(creatorKey("00000000-0000-4000-8000-000000000999"), {
    id: "00000000-0000-4000-8000-000000000999", createdAt: new Date().toISOString(), name: "Dev", bio: "", niche: "K-beauty", market: "US",
    languages: ["en"], ghostId: ghost.id, works: [], plan: "", script: "", account: dev,
  }, 60 * 60 * 24);
  await store.push(creatorsKey(dev.id), "00000000-0000-4000-8000-000000000999", 20, 60 * 60 * 24);
  await store.set(tasteKey(ghost.id, dev.id), await store.get(`taste:${ghost.id}`), 60 * 60 * 24);
  const { token } = await issueToken(store, dev);
  const res = NextResponse.json({ briefId: brief.id, token });
  // This dev browser acts as the operator, so the owner-only screens can be walked without a Google sign-in.
  const passcode = env.passcode();
  if (passcode) res.cookies.set(OWNER_COOKIE, ownerToken(passcode), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  return res;
}
