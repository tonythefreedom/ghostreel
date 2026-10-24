// The landing: what a stranger gets in ten seconds. Two lines, one line under them, one way in, then the ghost's own
// reel playing with its brief written over it by the coaching pencil, and the loop's steps, each a picture and a
// line. Nothing here promises views or earnings.
import { BriefVisual } from "@/components/landing/BriefVisual";
import { Band } from "@/components/landing/Band";
import { KeepVisual } from "@/components/landing/KeepVisual";
import { ButtonLink, Player } from "@/components/ui";
import { getLang } from "@/lib/lang";
import { t, type WordKey } from "@/lib/words";

const PREVIEW = "/prerender/yuna-percent-ready-preview";
const FRAME = "/prerender/keyframes/default-percent-ready-";
// The preview's four shots start where ffmpeg's scene detection finds its cuts (0, 2.2, 3.37, 5.3 s); each says one
// line of its script (public/prerender/manifest.json). Yuna speaks English; a Korean page writes its meaning first.
const BEATS: Array<{ t: number; say: WordKey; line: WordKey }> = [
  { t: 0, say: "landingSay1", line: "landingCue1" },
  { t: 2.2, say: "landingSay2", line: "landingCue2" },
  { t: 3.37, say: "landingSay3", line: "landingCue3" },
  { t: 5.3, say: "landingSay4", line: "landingCue4" },
];

export default async function Home() {
  const lang = await getLang();
  const cues = BEATS.map((b) => ({ t: b.t, title: t(b.say, lang), quote: lang === "ko" ? t(b.say, "en") : undefined, line: t(b.line, lang) }));
  return (
    <main className="flex min-h-dvh flex-col pb-10">
      <section className="flex flex-col gap-4 pt-4">
        <h1 className="text-display">
          <span className="block">{t("landingH1a", lang)}</span>
          <span className="block text-accent">{t("landingH1b", lang)}</span>
        </h1>
        <p className="text-[15px] leading-[1.5] text-text-dim">{t("landingLede", lang)}</p>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <ButtonLink size="xl" href="/onboard" className="sm:flex-1">
            {t("landingGo", lang)}
          </ButtonLink>
          <ButtonLink kind="secondary" size="xl" href="/connect">
            ✳ {t("landingClaudeGo", lang)}
          </ButtonLink>
        </div>
        <a href="#how" className="-mt-1 self-start text-[13px] font-[560] text-text-dim underline-offset-4 hover:text-text hover:underline">
          {t("landingHow", lang)} ↓
        </a>
      </section>

      <figure className="mt-8 flex flex-col gap-2">
        <Player src={`${PREVIEW}.mp4`} poster={`${PREVIEW}.jpg`} label={t("ghostPicture", lang)} cues={cues} cuts={BEATS.slice(1).map((b) => b.t)} />
        <figcaption className="text-[13px] leading-snug text-text-3">{t("landingPreviewNote", lang)}</figcaption>
      </figure>

      <div id="how" className="flex scroll-mt-16 flex-col gap-12 pt-12">
        <Band n={1} title={t("landingPickH", lang)} line={t("landingPickLine", lang)}>
          <KeepVisual lang={lang} />
        </Band>
        <Band n={2} title={t("landingApproveH", lang)} line={t("landingApproveLine", lang)}>
          <BriefVisual lang={lang} />
        </Band>
        <Band n={3} title={t("landingGetH", lang)} line={t("landingGetLine", lang)}>
          <div className="w-[72%]">
            <Player poster={`${FRAME}3.jpg`} autoPlay={false} label={t("ghostPicture", lang)} />
          </div>
        </Band>
        <Band n={4} title={t("landingClaudeH", lang)} line={t("landingClaudeLine", lang)}>
          <div aria-hidden className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface p-4 font-mono text-[12px] leading-relaxed">
            <span className="text-text-3">&gt; {t("connectAsk1", lang)}</span>
            <span className="text-accent">● ghostreel_trending</span>
            <span className="text-accent">● ghostreel_keep</span>
            <span className="text-accent">● ghostreel_brief_submit → {t("draft", lang)}</span>
            <span className="text-ghost">✓ ghostreel_render → {t("stepReady", lang)}</span>
          </div>
          <ButtonLink kind="secondary" size="l" href="/connect" className="self-start">
            ✳ {t("landingClaudeGo", lang)} →
          </ButtonLink>
        </Band>
      </div>

      <footer className="mt-12 border-t border-line pt-4">
        <p className="text-[13px] text-text-3">{t("landingFoot", lang)}</p>
      </footer>
    </main>
  );
}
