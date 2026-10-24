import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col justify-between py-10">
      <header className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-text-dim">
        <span className="inline-block size-2 rounded-full bg-ghost" aria-hidden />
        고스트릴 · GhostReel
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.02em]">
          얼굴도 촬영도 없이,
          <br />
          <span className="text-accent">내 감각</span>이 매일 일하는 채널.
        </h1>
        <p className="text-[15px] leading-relaxed text-text-dim">
          내가 고른 숏폼 감각을 사람처럼 출연하는 가상 캐릭터에 입혀, 전 세계에 매일 올라가는 채널을 부업으로 갖게
          합니다.
        </p>
      </section>

      <footer className="flex flex-col gap-4">
        <Link
          href="/onboard"
          className="grid h-14 w-full place-items-center rounded-[var(--radius-card)] bg-ghost text-[15px] font-extrabold text-bg"
        >
          내 고스트 만들기
        </Link>
        <p className="text-[13px] text-text-dim">
          모든 고스트 영상에는 <span className="font-semibold text-text">AI-generated · Virtual human</span> 라벨이
          항상 붙습니다.
        </p>
      </footer>
    </main>
  );
}
