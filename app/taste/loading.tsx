// Lane B. What /taste shows the moment its button is pressed, while the server waits on Shorti (this week's deck and a
// reading of each short). Words and the card's frame, never a spinner or a shimmer (DESIGN.md › Motion on screens).
import { getLang } from "@/lib/lang";
import { t } from "@/lib/words";

export default async function TasteLoading() {
  const lang = await getLang();
  return (
    <main className="flex min-h-dvh flex-col gap-4 pt-2" aria-busy="true">
      <header className="flex flex-col gap-2 pt-12">
        <h1 className="text-[26px] font-[720] leading-[1.15] tracking-[-0.02em]">{t("tasteTitle", lang)}</h1>
        <p className="text-[15px] leading-snug text-text-dim">{t("tasteSub", lang)}</p>
      </header>
      <div className="mx-auto flex aspect-[9/16] w-[78%] items-end rounded-[var(--radius-card)] bg-surface p-4">
        <p role="status" className="text-[13px] leading-snug text-text-dim">{t("tasteLoading", lang)}</p>
      </div>
    </main>
  );
}
