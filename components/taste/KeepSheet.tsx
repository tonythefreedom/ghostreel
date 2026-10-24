"use client";
// After a keep: what of that short the ghost keeps (hook · beat · look · sound), at least one. Closing the sheet takes
// the keep back; the short returns to the top of the deck.
import { useState } from "react";
import type { KeepPart, TrendCard as Card } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";
import { Button, Chip, ChipRow, Sheet } from "../ui";

const PARTS: KeepPart[] = ["hook", "beat", "look", "sound"];

export function KeepSheet({ card, onKeep, onCancel, lang }: {
  card: Card | null;
  onKeep: (parts: KeepPart[]) => void;
  onCancel: () => void;
  lang: UiLang;
}) {
  const [parts, setParts] = useState<KeepPart[]>(["hook"]);
  const [asked, setAsked] = useState<string | null>(null);
  const id = card?.videoId ?? null;
  if (id !== asked) {
    setAsked(id);
    if (id) setParts(["hook"]);
  }
  const toggle = (p: KeepPart) => setParts(parts.includes(p) ? parts.filter((x) => x !== p) : [...parts, p]);

  return (
    <Sheet
      open={card !== null}
      onClose={onCancel}
      title={t("keepWhat", lang)}
      foot={
        <Button size="xl" disabled={!parts.length} onClick={() => onKeep(parts)}>
          {t("keepThese", lang)}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {card ? <p className="text-[15px] text-text-dim">{card.hook ?? card.formatTitle}</p> : null}
        <ChipRow label={t("keepWhat", lang)}>
          {PARTS.map((p) => (
            <Chip key={p} on={parts.includes(p)} onClick={() => toggle(p)}>
              {t(p, lang)}
            </Chip>
          ))}
        </ChipRow>
        <p className="text-[13px] text-text-3">{t("keepPick", lang)}</p>
      </div>
    </Sheet>
  );
}
