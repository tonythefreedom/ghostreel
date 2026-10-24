"use client";
// Lane B (gift from Lane A, 10-24). The /kit page body: each piece wired to local state so it can be clicked through.
import { useState } from "react";
import type { Ghost, RenderJob } from "@/lib/types";
import { FunnelProgress, GhostDock, ReelGrid, ReelLightbox, SpendMeter, StepStrip } from ".";

export function KitPreview({ ghosts, jobs }: { ghosts: Ghost[]; jobs: RenderJob[] }) {
  const [lang, setLang] = useState<"ko" | "en">("en");
  const [ghost, setGhost] = useState(ghosts[0]?.id);
  const [step, setStep] = useState(2);
  const [open, setOpen] = useState<RenderJob | null>(null);
  const [used, setUsed] = useState(31);
  const h = "text-[13px] font-semibold text-text-dim";

  return (
    <main className="flex min-h-dvh flex-col gap-6 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]">Kit</h1>
        <button type="button" onClick={() => setLang(lang === "ko" ? "en" : "ko")} className="rounded-full border border-line px-3 py-1 text-[13px]">
          {lang === "ko" ? "EN" : "KO"}
        </button>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className={h}>FunnelProgress</h2>
        <FunnelProgress step={step} total={5} onBack={() => setStep((s) => Math.max(1, s - 1))} lang={lang} />
        <button type="button" onClick={() => setStep((s) => Math.min(5, s + 1))} className="self-start text-[13px] text-ghost">next →</button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={h}>StepStrip</h2>
        <StepStrip current={Math.min(3, step)} lang={lang} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={h}>GhostDock</h2>
        <GhostDock ghosts={ghosts} selectedId={ghost} onSelect={setGhost} onCreate={() => alert("new ghost")} lang={lang} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={h}>SpendMeter</h2>
        <SpendMeter used={used} cap={40} lang={lang} />
        <button type="button" onClick={() => setUsed((u) => (u >= 40 ? 0 : u + 3))} className="self-start text-[13px] text-ghost">spend 3 →</button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={h}>ReelGrid + ReelLightbox</h2>
        <ReelGrid jobs={jobs} onOpen={setOpen} lang={lang} />
        <ReelGrid jobs={[]} onOpen={setOpen} lang={lang} />
      </section>

      <ReelLightbox job={open} onClose={() => setOpen(null)} lang={lang} />
    </main>
  );
}
