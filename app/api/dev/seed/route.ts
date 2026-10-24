// Development only (404 in any build): seeds one kept pick and a draft brief from the recorded Shorti fixture,
// so the edit → approve → render flow can be exercised without a model key. The brief is marked "[dev]".
import { NextResponse } from "next/server";
import { finishBrief } from "@/lib/brief";
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
    { ghost, videoId: card.videoId, formatId: card.formatId, keep: ["hook", "beat"], intent: "adapt", reading: null, plan: null },
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
    },
  );
  await store.set(`brief:${brief.id}`, brief, 60 * 60 * 24);
  return NextResponse.json({ briefId: brief.id });
}
