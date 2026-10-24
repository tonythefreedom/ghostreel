// The landing: what a stranger gets in ten seconds. Two lines, one line under them, one way in, then the ghost's own
// picture and the loop's three steps, each a picture and a line. Nothing here promises views or earnings.
import { BriefVisual } from "@/components/landing/BriefVisual";
import { Band } from "@/components/landing/Band";
import { KeepVisual } from "@/components/landing/KeepVisual";
import { ButtonLink, Player } from "@/components/ui";
import { t } from "@/lib/words";

const FRAME = "/prerender/keyframes/default-percent-ready-";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col pb-10">
      <header className="flex h-14 items-center gap-2 text-[13px] font-[560] text-text-dim">
        <span aria-hidden className="size-2 rounded-full bg-accent" />
        {t("brand")}
      </header>

      <section className="flex flex-col gap-4 pt-4">
        <h1 className="text-display">
          <span className="block">{t("landingH1a")}</span>
          <span className="block text-accent">{t("landingH1b")}</span>
        </h1>
        <p className="text-[15px] leading-[1.5] text-text-dim">{t("landingLede")}</p>
        <div className="flex items-center gap-3 pt-1">
          <ButtonLink size="xl" href="/onboard" className="flex-1">
            {t("landingGo")}
          </ButtonLink>
          <ButtonLink kind="quiet" size="xl" href="#how">
            {t("landingHow")}
          </ButtonLink>
        </div>
      </section>

      <figure className="mt-8">
        <Player poster={`${FRAME}0.jpg`} autoPlay={false} label={t("ghostPicture")} />
      </figure>

      <div id="how" className="flex scroll-mt-6 flex-col gap-10 pt-10">
        <Band n={1} title={t("landingPickH")} line={t("landingPickLine")}>
          <KeepVisual />
        </Band>
        <Band n={2} title={t("landingApproveH")} line={t("landingApproveLine")}>
          <BriefVisual />
        </Band>
        <Band n={3} title={t("landingGetH")} line={t("landingGetLine")}>
          <div className="w-[72%]">
            <Player poster={`${FRAME}3.jpg`} autoPlay={false} label={t("ghostPicture")} />
          </div>
        </Band>
      </div>

      <footer className="mt-10 border-t border-line pt-4">
        <p className="text-[13px] text-text-3">{t("landingFoot")}</p>
      </footer>
    </main>
  );
}
