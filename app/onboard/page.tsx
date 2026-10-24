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
          GhostReel · Sign up
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">Tell us about your work, once</h1>
        <p className="text-[15px] text-text-dim">
          We read the shorts and plans you've made, learn your style, and a virtual human makes a new short in it every day, ready to schedule.
        </p>
      </header>
      <OnboardForm ghosts={ghosts} />
    </main>
  );
}
