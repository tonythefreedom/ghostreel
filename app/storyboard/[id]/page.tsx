// Lane B (T23). The storyboard for one brief: a scene per timed beat, in order, before the render.
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StoryboardFrame } from "@/components/StoryboardFrame";
import { getGhost } from "@/lib/newtype";
import { LineSuggestions, suggestionsFor } from "@/lib/lineSuggestions";
import { buildStoryboard, KeyframeManifest } from "@/lib/storyboard";
import { store } from "@/lib/store";
import type { Brief } from "@/lib/types";
import lineData from "@/content/line-suggestions.json";
import keyframes from "@/public/prerender/keyframes.json";

export const dynamic = "force-dynamic";

const manifest = KeyframeManifest.parse(keyframes);
const lineSuggestions = LineSuggestions.parse(lineData);

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const brief = await store.get<Brief>(`brief:${id}`);
  if (!brief) notFound();
  const ghost = await getGhost(brief.ghostId);
  if (!ghost) notFound();
  const frames = buildStoryboard(brief, ghost, manifest);
  const made = frames.filter((f) => f.image).length;
  const lines = suggestionsFor(brief, lineSuggestions);
  const locked = brief.status === "approved";

  return (
    <main className="flex min-h-dvh flex-col gap-5 py-6 pb-28">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-text">
            {ghost.name.slice(0, 1)}
          </span>
          {ghost.name} · 콘티
          <span className="font-mono text-[11px]">{brief.durationSec}s · 9:16 · {brief.lang.toUpperCase()}</span>
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">{brief.hook}</h1>
        <p className="text-[13px] text-text-dim">
          비트 {frames.length}개 · 장면 {made}개 준비됨. 장면은 CineSynth 로 만들고, 만들기 전에는 쓸 프롬프트를 보여 줍니다.
        </p>
        {lines.readAt ? (
          <p className="text-[12px] text-text-dim">
            대사 후보는 Shorti 가 {lines.readAt.slice(5, 10).replace("-", "/")} 에 읽은 이번 주 포맷(훅과 빈자리)을 바탕으로 GhostReel 이 썼어요.
            {locked ? " 승인된 브리프라 바꿀 수 없어요." : " 고르면 브리프에 바로 반영돼요."}
          </p>
        ) : null}
      </header>

      <ol className="grid grid-cols-2 gap-3">
        {frames.map((f) => (
          <StoryboardFrame key={f.index} frame={f}
            pick={{ briefId: brief.id, lines: brief.lines, options: lines.beats[f.index] ?? [], locked }} />
        ))}
      </ol>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-[430px] px-4">
          <Link href={`/brief/${brief.id}`}
            className="grid h-14 w-full place-items-center rounded-[var(--radius-card)] bg-accent text-[15px] font-extrabold">
            {brief.status === "approved" ? "브리프와 렌더 보기" : "브리프로 돌아가 승인하기"}
          </Link>
        </div>
      </div>
    </main>
  );
}
