// Lane B (gift from Lane A, 10-24). The three steps of the loop as cards, for an empty screen or the landing:
// each is done, current, or ahead, so a first-time person sees where they are and what comes next.
import { segments } from "./logic";

export type Step = { title: string; body: string };

export const LOOP_STEPS: Record<"ko" | "en", Step[]> = {
  ko: [
    { title: "고르기", body: "해외에서 뜨는 숏폼에서 고스트에게 가르칠 감각을 남겨요." },
    { title: "승인하기", body: "고스트가 쓴 브리프를 고치고, 마음에 들면 승인해요." },
    { title: "받기", body: "고스트가 출연한 숏폼을 받아 올려요. 내 얼굴은 나오지 않아요." },
  ],
  en: [
    { title: "Pick", body: "Keep what you like from shorts trending abroad; that is what the ghost learns." },
    { title: "Approve", body: "Edit the brief the ghost wrote, then approve it." },
    { title: "Get it", body: "Get the short your ghost stars in and post it. Your face never appears." },
  ],
};

export function StepStrip({ steps, current, lang = "en" }: { steps?: Step[]; current: number; lang?: "ko" | "en" }) {
  const list = steps ?? LOOP_STEPS[lang];
  const marks = segments(current, list.length);
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {list.map((s, i) => {
        const mark = marks[i] ?? "ahead";
        return (
          <li key={s.title} aria-current={mark === "now" ? "step" : undefined}
            className={`flex flex-col gap-1 rounded-[var(--radius-card)] border p-3 ${mark === "now" ? "border-accent bg-accent-soft" : "border-line bg-surface"} ${mark === "ahead" ? "opacity-70" : ""}`}>
            <span className={`font-mono text-[13px] ${mark === "done" ? "text-ghost" : "text-text-dim"}`}>
              {mark === "done" ? "✓" : String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[15px] font-extrabold">{s.title}</span>
            <span className="text-[13px] leading-snug text-text-dim">{s.body}</span>
          </li>
        );
      })}
    </ol>
  );
}
