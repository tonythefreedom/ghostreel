// Lane A. The ghost at the top of its channel: a violet-ringed face (portrait, or its monogram until NEWTYPE sends
// one), its name, what it makes and for whom, the AI label, and one line on where its reels come from.
import { AiLabel } from "@/components/ui";
import type { Ghost } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";

export function ChannelHead({ ghost, lang }: { ghost: Ghost; lang: UiLang }) {
  const meta = [ghost.niche, ghost.market, ghost.languages.map((l) => l.toUpperCase()).join(" · ")].filter(Boolean);
  return (
    <header className="flex flex-col items-start gap-3">
      <span className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft ring-2 ring-accent ring-offset-2 ring-offset-bg">
        {ghost.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ghost.portraitUrl} alt="" className="size-full object-cover object-[50%_16%] scale-[1.6] origin-[50%_14%]" />
        ) : (
          <span aria-hidden className="text-[28px] font-[720] text-text">{ghost.name.slice(0, 1)}</span>
        )}
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-[720] leading-tight tracking-[-0.02em]">{ghost.name}</h1>
        <p className="text-[15px] text-text-dim">{meta.join(" · ")}</p>
      </div>
      <AiLabel />
      <p className="text-[13px] text-text-3">{t("channelTrust", lang)}</p>
    </header>
  );
}
