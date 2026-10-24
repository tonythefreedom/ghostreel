import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col justify-between py-10">
      <header className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-text-dim">
        <span className="inline-block size-2 rounded-full bg-ghost" aria-hidden />
        GhostReel
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.02em]">
          No face, no shoot.
          <br />
          <span className="text-accent">Your style</span> posts every day.
        </h1>
        <p className="text-[15px] leading-relaxed text-text-dim">
          GhostReel learns your style from your own shorts and this week's trends, and a virtual human performs it in a
          new short every day, scheduled for a global channel you run on the side.
        </p>
      </section>

      <footer className="flex flex-col gap-4">
        <Link
          href="/onboard"
          className="grid h-14 w-full place-items-center rounded-[var(--radius-card)] bg-ghost text-[15px] font-extrabold text-bg"
        >
          Make my ghost
        </Link>
        <p className="text-[13px] text-text-dim">
          Every ghost video carries the <span className="font-semibold text-text">AI-generated · Virtual human</span>{" "}
          label.
        </p>
      </footer>
    </main>
  );
}
