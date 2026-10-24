"use client";
// The loop under the brief (Ted, 10-24: «claude mcp로 연결한게 read 되고나서 결과물을 다시 write되게»): the owner leaves
// a note, their own Claude reads the brief and the note over MCP and writes the next version back onto this page.
// Here: every version so far, who wrote it and what it changed; the note; and the sentence to send Claude. Once the
// brief is approved, the same panel turns into making the shoot from it.
import { ClaudeMake } from "@/components/ClaudeMake";
import { Button } from "@/components/ui";
import type { Brief, BriefAuthor } from "@/lib/types";
import { fill, t, type UiLang, type WordKey } from "@/lib/words";
import { fieldClass, labelClass } from "./field";

const BY: Record<BriefAuthor, WordKey> = { ghostreel: "byGhostreel", claude: "byClaude", owner: "byOwner" };

export function BriefLoop({ brief, note, onNote, onSaveNote, noteState, lang }: {
  brief: Brief;
  note: string;
  onNote: (note: string) => void;
  onSaveNote: () => void;
  noteState: "idle" | "saving" | "saved";
  lang: UiLang;
}) {
  const editable = brief.status === "draft";
  const versions = [
    { version: brief.version, by: brief.by, change: brief.change, hook: brief.hook, now: true },
    ...brief.history.map((h) => ({ ...h, now: false })),
  ];
  return (
    <section aria-labelledby="loop" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="loop" className="text-[18px] font-[720] tracking-[-0.01em]">{t(editable ? "loopTitle" : "cmTitleShoot", lang)}</h2>
        {editable ? <p className="text-[13px] leading-snug text-text-3">{t("loopLine", lang)}</p> : null}
      </div>

      <ol className="flex flex-col gap-1.5" aria-label={t("versionWord", lang)}>
        {versions.slice(0, 4).map((v) => (
          <li key={v.version} className={`flex items-start gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-[13px] ring-1 ring-inset ${v.now ? "bg-surface ring-line-strong" : "ring-line"}`}>
            <span className={`shrink-0 font-mono font-[720] ${v.now ? "text-pencil" : "text-text-3"}`}>v{v.version}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={v.now ? "font-[640] text-text" : "text-text-dim"}>{t(BY[v.by], lang)}</span>
              <span className="truncate text-[12px] text-text-3">{v.change || v.hook}</span>
            </span>
          </li>
        ))}
      </ol>

      {editable ? (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("noteLabel", lang)}</span>
          <textarea rows={2} value={note} maxLength={400} placeholder={t("notePh", lang)} onChange={(e) => onNote(e.target.value)}
            className={`${fieldClass} min-h-[4.5rem] resize-none [field-sizing:content]`} />
          <span className="flex items-center justify-end gap-3">
            {noteState === "saved" && note === brief.note ? <span className="text-[12px] font-[640] text-ghost">{t("noteSaved", lang)}</span> : null}
            <Button kind="secondary" size="m" disabled={noteState === "saving" || note === brief.note} onClick={onSaveNote}>
              {t("noteSave", lang)}
            </Button>
          </span>
        </label>
      ) : null}

      <ClaudeMake kind={editable ? "revise" : "shoot"} ask={fill(t(editable ? "cmAskRevise" : "cmAskShoot", lang), { id: brief.id })} />
    </section>
  );
}

/** "Version 3 is in" with the words of who wrote it, for the banner when Claude writes while the page is open. */
export const versionLine = (brief: Brief, lang: UiLang) => `${fill(t("newVersion", lang), { n: brief.version })} · ${t(BY[brief.by], lang)}`;
