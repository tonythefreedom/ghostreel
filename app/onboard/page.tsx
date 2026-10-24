// Lane B (T8). Registration: the creator's background, past shorts, plans and scripts, and the virtual human.
import { OnboardForm } from "@/components/OnboardForm";
import { listCharacters } from "@/lib/newtype";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const ghosts = await listCharacters();
  return (
    <main className="flex min-h-dvh flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dim">
          <span className="inline-block size-2 rounded-full bg-ghost" aria-hidden />
          고스트릴 · 등록
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">내 작품을 한 번만 알려 주세요</h1>
        <p className="text-[15px] text-text-dim">
          올려 온 숏폼과 기획을 읽고 내 스타일을 배워, 가상 인물이 매일 새 숏폼을 만들어 예약해 둡니다.
        </p>
      </header>
      <OnboardForm ghosts={ghosts} />
    </main>
  );
}
