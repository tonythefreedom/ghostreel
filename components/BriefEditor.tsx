"use client";
// The owner's last word before any GPU spend: the hook as the title, the beats on a rail with the chosen one opened,
// the rest folded away, and one docked verb. Approving locks the brief; the render route refuses anything unapproved.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink, Rail, Verb, VerbSpacer, type Beat } from "@/components/ui";
import type { Brief, BriefLine, KeepPart, RenderJob } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";
import { BeatCard } from "./brief/BeatCard";
import { BriefHead } from "./brief/BriefHead";
import { KeptLine } from "./brief/KeptLine";
import { MoreDetail } from "./brief/MoreDetail";
import { RenderState } from "./brief/RenderState";
import { SpeechMeter } from "./brief/SpeechMeter";
import { UnlockForm } from "./UnlockForm";

type GhostFace = { id: string; name: string; portraitUrl?: string };

// A beat's rail title: its first words, whole, never cut with an ellipsis.
function beatTitle(line: BriefLine, i: number, lang: UiLang): string {
  const say = line.say.trim();
  if (!say) return `${t("beatWord", lang)} ${i + 1}`;
  const words = say.split(/\s+/);
  return words.length > 1 ? words.slice(0, 3).join(" ") : [...say].slice(0, 8).join("");
}

export function BriefEditor({ initial, initialJob, ghost, kept = [], lang = "en" }: {
  initial: Brief;
  initialJob: RenderJob | null;
  ghost: GhostFace;
  kept?: KeepPart[];
  lang?: UiLang;
}) {
  const [brief, setBrief] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<WordKey | null>(null);
  const [locked, setLocked] = useState<null | (() => void)>(null);
  const [job, setJob] = useState(initialJob);
  const [selected, setSelected] = useState(0);
  const editable = brief.status === "draft";
  const sel = Math.min(selected, brief.lines.length - 1);
  const rail = useRef<HTMLDivElement>(null);

  // The chosen beat stays in sight on a narrow rail, whether a finger, a key or "Add beat" chose it.
  useEffect(() => {
    rail.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [sel]);

  const edit = (patch: Partial<Brief>) => {
    setBrief({ ...brief, ...patch });
    setDirty(true);
  };
  const editLine = (i: number, patch: Partial<BriefLine>) => edit({ lines: brief.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const addLine = () => {
    edit({ lines: [...brief.lines, { t: Math.min((brief.lines.at(-1)?.t ?? 0) + 2, brief.durationSec - 0.5), say: "", do: "" }] });
    setSelected(brief.lines.length);
  };
  const removeLine = (i: number) => {
    edit({ lines: brief.lines.filter((_, j) => j !== i) });
    setSelected(Math.max(0, i - 1));
  };

  // Poll while a render is in flight.
  useEffect(() => {
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/render?brief=${brief.id}`);
      const body = (await res.json()) as { job: RenderJob | null };
      if (body.job) setJob(body.job);
    }, 4000);
    return () => clearInterval(id);
  }, [job, brief.id]);

  async function call(route: "brief" | "render", method: string, payload: object, retry: () => void): Promise<Response | null> {
    const res = await fetch(`/api/${route}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (res.status === 401) {
      setLocked(() => retry);
      return null;
    }
    return res;
  }

  async function save(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { hook, lines, outfit, scene, caption, hashtags, durationSec } = brief;
      const res = await call("brief", "PATCH", { id: brief.id, approve, edits: { hook, lines, outfit, scene, caption, hashtags, durationSec } }, () => void save(approve));
      if (!res) return;
      const body = (await res.json()) as { brief?: Brief };
      if (!res.ok || !body.brief) return setError("editFailed");
      setBrief(body.brief);
      setDirty(false);
      if (approve) await startRender();
    } finally {
      setBusy(false);
    }
  }

  async function startRender() {
    setError(null);
    const res = await call("render", "POST", { briefId: brief.id }, () => void startRender());
    if (!res) return;
    const body = (await res.json()) as { job?: RenderJob };
    if (body.job) setJob(body.job);
    else setError("renderFailed");
  }

  const beats: Beat[] = brief.lines.map((l, i) => ({ at: l.t, title: beatTitle(l, i, lang) }));
  const line = brief.lines[sel];

  return (
    <div className="flex flex-col gap-5">
      <BriefHead name={ghost.name} status={brief.status} duration={brief.durationSec} editable={editable} onDuration={(d) => edit({ durationSec: d })} lang={lang} />

      <div className="flex flex-col gap-2">
        {editable ? (
          <textarea
            aria-label={t("hookLabel", lang)}
            rows={2}
            value={brief.hook}
            maxLength={160}
            onChange={(e) => edit({ hook: e.target.value })}
            className="-mx-2 w-[calc(100%+16px)] resize-none rounded-[var(--radius-pic)] bg-transparent px-2 py-1 text-[22px] font-[720] leading-[1.25] tracking-[-0.02em] [field-sizing:content] hover:bg-surface focus:bg-surface"
          />
        ) : (
          <h1 className="text-[22px] font-[720] leading-[1.25] tracking-[-0.02em]">{brief.hook}</h1>
        )}
        <SpeechMeter brief={brief} lang={lang} />
        <KeptLine intent={brief.intent} kept={kept} twist={brief.twist} lang={lang} />
      </div>

      <div className="flex flex-col gap-3">
        <div ref={rail}>
          <Rail beats={beats} selected={sel} onSelect={setSelected} length={brief.durationSec} label={t("beat", lang)} />
        </div>
        {line ? (
          <BeatCard
            line={line}
            index={sel}
            editable={editable}
            maxT={brief.durationSec - 0.5}
            canRemove={brief.lines.length > 2}
            onChange={(patch) => editLine(sel, patch)}
            onRemove={() => removeLine(sel)}
            lang={lang}
          />
        ) : null}
        {editable && brief.lines.length < 6 ? (
          <Button kind="quiet" size="m" onClick={addLine} className="self-start">
            {t("addLine", lang)}
          </Button>
        ) : null}
      </div>

      <MoreDetail brief={brief} editable={editable} onEdit={edit} lang={lang} />

      {!editable && job ? <RenderState job={job} brief={brief} poster={ghost.portraitUrl} lang={lang} /> : null}

      <Link href={`/storyboard/${brief.id}`} className="-my-2 inline-flex min-h-11 items-center self-end text-[13px] font-[560] text-text-dim underline-offset-4 hover:text-text hover:underline">
        {t("storyboard", lang)} →
      </Link>
      <VerbSpacer />
      <div aria-hidden className="h-10" />

      <Verb note={error ? <span role="alert" className="text-danger">✕ {t(error, lang)}</span> : editable && !locked ? t("approveNote", lang) : undefined}>
        {locked ? (
          <UnlockForm
            lang={lang}
            onUnlocked={() => {
              const retry = locked;
              setLocked(null);
              retry();
            }}
          />
        ) : editable ? (
          <>
            <Button kind="secondary" size="xl" disabled={!dirty || busy} onClick={() => void save(false)}>
              {dirty ? t("save", lang) : t("saved", lang)}
            </Button>
            <Button size="xl" disabled={busy} onClick={() => void save(true)}>
              {t("approveRender", lang)}
            </Button>
          </>
        ) : !job || job.status === "failed" ? (
          <Button size="xl" onClick={() => void startRender()}>
            {t(job ? "renderRetry" : "renderStart", lang)}
          </Button>
        ) : (
          <ButtonLink size="xl" href={`/taste?ghost=${ghost.id}`}>
            {t("nextShort", lang)}
          </ButtonLink>
        )}
      </Verb>
    </div>
  );
}
