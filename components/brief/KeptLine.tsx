// What the owner kept from the original and how close the take stays: quiet words, not controls. Picking happened in
// /taste; here it is only remembered so the owner reads the brief against it.
import type { Intent, KeepPart } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";

const INTENT: Record<Intent, WordKey> = { keep: "intentKeepLong", adapt: "intentAdaptLong", twist: "intentTwistLong" };
const PART: Record<KeepPart, WordKey> = { hook: "hook", beat: "beat", look: "look", sound: "sound" };

export function KeptLine({ intent, kept, twist, lang }: { intent: Intent; kept: KeepPart[]; twist: string; lang: UiLang }) {
  return (
    <div className="flex flex-col gap-0.5 text-[13px] text-text-3">
      <p>
        <span className="font-[560] text-text-dim">{t(INTENT[intent], lang)}</span>
        {kept.length ? ` · ${t("keptParts", lang)}: ${kept.map((k) => t(PART[k], lang)).join(", ")}` : ""}
      </p>
      {twist ? (
        <p>
          {t("twistUsed", lang)} · <span className="text-text-dim">{twist}</span>
        </p>
      ) : null}
    </div>
  );
}
