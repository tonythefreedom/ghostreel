"use client";
// The owner's last word before any GPU spend: the hook as the title, the beats on a rail with the chosen one opened,
// the rest folded away, and one docked verb. Approving locks the brief; the render route refuses anything unapproved.
// On a Korean page each part shows its Korean beside the words the ghost performs. Under it, the loop with the
// person's own Claude: a note for it, and every version it wrote back, arriving here while the page is open.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, ButtonLink, Rail, Verb, VerbSpacer, type Beat } from "@/components/ui";
import type { Brief, BriefLine, KeepPart, RenderJob } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";
import { BeatCard } from "./brief/BeatCard";
import { BriefHead } from "./brief/BriefHead";
import { BriefLoop, versionLine } from "./brief/BriefLoop";
import { KeptLine } from "./brief/KeptLine";
import { MoreDetail } from "./brief/MoreDetail";
import { RenderState, RenderStatusLine } from "./brief/RenderState";
import { SpeechMeter } from "./brief/SpeechMeter";
import { UnlockForm } from "./UnlockForm";
import { useLang } from "@/components/Lang";

type GhostFace = { id: string; name: string; portraitUrl?: string };

// A beat's rail title: its first words, whole, never cut with an ellipsis.
function beatTitle(line: BriefLine, i: number, lang: UiLang): string {
  const say = line.say.trim();
  if (!say) return `${t("beatWord", lang)} ${i + 1}`;
  const words = say.split(/\s+/);
  return words.length > 1 ? words.slice(0, 3).join(" ") : [...say].slice(0, 8).join("");
}

export function BriefEditor({ initial, initialJob, ghost, kept = [], extra, fallback, lang: langProp }: {
  initial: Brief;
  initialJob: RenderJob | null;
  /** The pre-rendered clip shown, labelled, if a live render fails. */
  fallback?: { src: string; poster?: string };
  ghost: GhostFace;
  kept?: KeepPart[];
  /** What the page shows under the brief: the source short and its camera preset. */
  extra?: ReactNode;
  lang?: UiLang;
}) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const [brief, setBrief] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<WordKey | null>(null);
  const [locked, setLocked] = useState<null | (() => void)>(null);
  const [job, setJob] = useState(initialJob);
  const [selected, setSelected] = useState(0);
  const [note, setNote] = useState(initial.note);
  const [noteState, setNoteState] = useState<"idle" | "saving" | "saved">("idle");
  const [arrived, setArrived] = useState<Brief | null>(null); // a newer version, held while there are unsaved edits
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
  // An edited beat's Korean no longer says the same thing; it goes until the next version writes it again.
  const editLine = (i: number, patch: Partial<BriefLine>) =>
    edit({ lines: brief.lines.map((l, j) => (j === i ? { ...l, ...patch, ko: "say" in patch || "do" in patch ? undefined : l.ko } : l)) });

  // The loop's write-back: a version the person's Claude saved while this page is open shows up here.
  const latest = useRef({ version: brief.version, dirty });
  latest.current = { version: brief.version, dirty };
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/brief?id=${brief.id}`).catch(() => null);
      const body = res?.ok ? ((await res.json()) as { brief?: Brief }) : null;
      const next = body?.brief;
      if (!next || next.version <= latest.current.version) return;
      if (latest.current.dirty) return setArrived(next);
      setBrief(next);
      setNote(next.note);
      setArrived(null);
      setFlash(versionLine(next, lang));
    }, 5000);
    return () => clearInterval(id);
  }, [brief.id, lang]);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(id);
  }, [flash]);
  const load = (next: Brief) => {
    setBrief(next);
    setNote(next.note);
    setDirty(false);
    setArrived(null);
  };

  async function saveNote() {
    setNoteState("saving");
    const res = await call("brief", "PATCH", { id: brief.id, approve: false, edits: { note } }, () => void saveNote());
    if (!res) return setNoteState("idle");
    const body = (await res.json()) as { brief?: Brief };
    if (!res.ok || !body.brief) {
      setNoteState("idle");
      return setError("editFailed");
    }
    const saved = body.brief;
    setBrief((b) => ({ ...b, note: saved.note, updatedAt: saved.updatedAt }));
    setNoteState("saved");
  }
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
      const res = await call("brief", "PATCH", { id: brief.id, approve, edits: { hook, lines, outfit, scene, caption, hashtags, durationSec, note } }, () => void save(approve));
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

  // One start at a time: a second press while the first is on its way would start a second GPU render.
  const starting = useRef(false);
  async function startRender() {
    if (starting.current) return;
    starting.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await call("render", "POST", { briefId: brief.id }, () => void startRender());
      if (!res) return;
      const body = (await res.json()) as { job?: RenderJob };
      if (body.job) {
        setJob(body.job);
        // The render's own view sits mid-page; bring it into sight once it starts.
        requestAnimationFrame(() => document.getElementById("render")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      } else setError("renderFailed");
    } finally {
      starting.current = false;
      setBusy(false);
    }
  }

  const beats: Beat[] = brief.lines.map((l, i) => ({ at: l.t, title: beatTitle(l, i, lang) }));
  const line = brief.lines[sel];
  const ko = lang === "ko" && Boolean(brief.ko); // this brief was written with its Korean beside it

  return (
    <div className="flex flex-col gap-5">
      <BriefHead name={ghost.name} status={brief.status} version={brief.version} duration={brief.durationSec} editable={editable} onDuration={(d) => edit({ durationSec: d })} lang={lang} />
      {flash ? (
        <p role="status" className="-mb-2 rounded-[var(--radius-control)] bg-pencil/12 px-3 py-2 text-[13px] font-[640] text-pencil ring-1 ring-inset ring-pencil/40">✎ {flash}{brief.change ? ` — ${brief.change}` : ""}</p>
      ) : null}
      {arrived ? (
        <div role="status" className="-mb-2 flex items-center gap-3 rounded-[var(--radius-control)] bg-pencil/12 px-3 py-2 ring-1 ring-inset ring-pencil/40">
          <span className="min-w-0 flex-1 text-[13px] leading-snug">
            <span className="font-[640] text-pencil">✎ {versionLine(arrived, lang)}</span>
            <span className="block text-[12px] text-text-3">{t("loadDrops", lang)}</span>
          </span>
          <Button kind="secondary" size="m" onClick={() => load(arrived)}>{t("loadIt", lang)}</Button>
        </div>
      ) : null}

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
        {ko && brief.ko?.hook ? <p className="-mt-1 text-[15px] leading-snug text-text-dim">{brief.ko.hook}</p> : null}
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
            ko={ko}
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

      {!editable && job ? <RenderState job={job} brief={brief} poster={ghost.portraitUrl} fallback={fallback} lang={lang} /> : null}

      <BriefLoop brief={brief} note={note} onNote={(n) => { setNote(n); setNoteState("idle"); }} onSaveNote={() => void saveNote()} noteState={noteState} lang={lang} />

      <Link href={`/storyboard/${brief.id}`} className="-my-2 inline-flex min-h-11 items-center self-end text-[13px] font-[560] text-text-dim underline-offset-4 hover:text-text hover:underline">
        {t("storyboard", lang)} →
      </Link>
      {extra}
      <VerbSpacer />
      <div aria-hidden className="h-10" />

      <Verb note={error ? <span role="alert" className="text-danger">✕ {t(error, lang)}</span> : locked ? undefined : job?.provider === "newtype" && (job.status === "queued" || job.status === "running") ? (
        <RenderStatusLine job={job} lang={lang} />
      ) : (
        // Beside the render, the other way to make it: the person's own Claude over MCP (Ted, 10-24).
        <span className="flex items-center justify-center gap-2">
          <span className="truncate">{editable ? t("approveNote", lang) : t("renderByClaude", lang)}</span>
          <a href="#loop" className="shrink-0 whitespace-nowrap font-[640] text-text underline decoration-accent underline-offset-2">✳ {t("cmTitleShoot", lang)}</a>
        </span>
      )}>
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
          <Button size="xl" disabled={busy} onClick={() => void startRender()}>
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
