"use client";
// The owner's last word before any GPU spend: edit the ghost's draft inline, then approve and render.
// Approving locks the brief; the render route refuses anything unapproved.
import { useEffect, useState } from "react";
import type { Brief, RenderJob } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";
import { UnlockForm } from "./UnlockForm";

const field = "w-full rounded-[var(--radius-card)] border border-line bg-bg px-3 py-2 text-[15px] focus:border-accent focus:outline-none";
const JOB_WORD: Record<RenderJob["status"], WordKey> = {
  queued: "renderQueued",
  running: "renderRunning",
  done: "renderDone",
  failed: "renderFailed",
};

export function BriefEditor({ initial, initialJob, lang = "ko" }: { initial: Brief; initialJob: RenderJob | null; lang?: UiLang }) {
  const [brief, setBrief] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<WordKey | null>(null);
  const [locked, setLocked] = useState<null | (() => void)>(null);
  const [job, setJob] = useState(initialJob);
  const editable = brief.status === "draft";

  const edit = (patch: Partial<Brief>) => {
    setBrief({ ...brief, ...patch });
    setDirty(true);
  };
  const editLine = (i: number, patch: Partial<Brief["lines"][number]>) =>
    edit({ lines: brief.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

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
    const res = await call("render", "POST", { briefId: brief.id }, () => void startRender());
    if (!res) return;
    const body = (await res.json()) as { job?: RenderJob };
    if (body.job) setJob(body.job);
  }

  return (
    <div className="flex flex-col gap-5 pb-28">
      <label className="flex flex-col gap-1">
        <span className="text-[13px] text-text-dim">{t("hookLabel", lang)}</span>
        {editable ? (
          <textarea rows={2} value={brief.hook} maxLength={160} onChange={(e) => edit({ hook: e.target.value })} className={`${field} text-[18px] font-extrabold`} />
        ) : (
          <p className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">{brief.hook}</p>
        )}
      </label>

      <div className="flex items-center gap-2">
        {([10, 15] as const).map((d) => (
          <button
            key={d}
            type="button"
            disabled={!editable}
            onClick={() => edit({ durationSec: d })}
            className={`h-8 rounded-full px-3 font-mono text-[13px] ${brief.durationSec === d ? "bg-surface-2 text-text" : "text-text-dim"}`}
          >
            {d}s
          </button>
        ))}
        <span className="font-mono text-[12px] text-text-dim">9:16 · {brief.lang.toUpperCase()}</span>
      </div>

      <ol className="flex flex-col gap-3">
        {brief.lines.map((line, i) => (
          <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            {editable && i > 0 ? (
              <input
                type="number"
                step={0.5}
                min={0}
                max={brief.durationSec - 0.5}
                value={line.t}
                onChange={(e) => editLine(i, { t: Number(e.target.value) })}
                className="h-9 rounded-lg border border-line bg-bg px-2 font-mono text-[13px] text-accent"
              />
            ) : (
              <span className="pt-1 font-mono text-[13px] text-accent">{line.t.toFixed(1)}s</span>
            )}
            <div className="flex flex-col gap-2">
              {editable ? (
                <>
                  <input aria-label={t("say", lang)} value={line.say} maxLength={200} onChange={(e) => editLine(i, { say: e.target.value })} className={`${field} font-semibold`} />
                  <textarea aria-label={t("doLabel", lang)} rows={2} value={line.do} maxLength={200} onChange={(e) => editLine(i, { do: e.target.value })} className={`${field} text-[13px] text-text-dim`} />
                  {brief.lines.length > 2 ? (
                    <button type="button" onClick={() => edit({ lines: brief.lines.filter((_, j) => j !== i) })} className="self-end text-[12px] text-danger">
                      {t("remove", lang)}
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-[15px] font-semibold">“{line.say}”</p>
                  <p className="text-[13px] text-text-dim">{line.do}</p>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
      {editable && brief.lines.length < 6 ? (
        <button
          type="button"
          onClick={() => edit({ lines: [...brief.lines, { t: Math.min((brief.lines.at(-1)?.t ?? 0) + 2, brief.durationSec - 0.5), say: "", do: "" }] })}
          className="h-10 rounded-[var(--radius-card)] border border-dashed border-line text-[13px] text-text-dim"
        >
          {t("addLine", lang)}
        </button>
      ) : null}

      {(
        [
          ["outfit", "outfit", 160],
          ["scene", "scene", 200],
          ["caption", "caption", 300],
        ] as const
      ).map(([key, label, max]) => (
        <label key={key} className="flex flex-col gap-1">
          <span className="text-[13px] text-text-dim">{t(label, lang)}</span>
          {editable ? (
            <textarea rows={key === "caption" ? 3 : 2} value={brief[key]} maxLength={max} onChange={(e) => edit({ [key]: e.target.value })} className={field} />
          ) : (
            <p className="text-[15px]">{brief[key]}</p>
          )}
        </label>
      ))}
      <label className="flex flex-col gap-1">
        <span className="text-[13px] text-text-dim">{t("hashtags", lang)}</span>
        {editable ? (
          <input value={brief.hashtags.join(" ")} onChange={(e) => edit({ hashtags: e.target.value.split(/\s+/).slice(0, 8) })} className={`${field} text-accent`} />
        ) : (
          <p className="text-[15px] text-accent">{brief.hashtags.map((h) => `#${h}`).join(" ")}</p>
        )}
      </label>

      <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-2 px-4 py-3">
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
              <p className="text-[12px] text-text-dim">{t("approveNote", lang)}</p>
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button type="button" disabled={!dirty || busy} onClick={() => void save(false)} className="h-12 rounded-[var(--radius-card)] border border-line px-4 font-semibold disabled:opacity-40">
                  {dirty ? t("save", lang) : t("saved", lang)}
                </button>
                <button type="button" disabled={busy} onClick={() => void save(true)} className="h-12 rounded-[var(--radius-card)] bg-accent font-extrabold disabled:opacity-60">
                  {t("approveRender", lang)}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-ghost/15 px-3 py-1 text-[13px] font-semibold text-ghost">{t("approved", lang)}</span>
              {job ? (
                <span className={`text-[13px] font-semibold ${job.status === "failed" ? "text-danger" : "text-text"}`}>
                  {t(JOB_WORD[job.status], lang)}
                  {job.error ? ` · ${job.error}` : ""}
                </span>
              ) : null}
              {!job || job.status === "failed" ? (
                <button type="button" onClick={() => void startRender()} className="h-10 shrink-0 whitespace-nowrap rounded-[var(--radius-card)] bg-accent px-4 text-[13px] font-extrabold">
                  {t("renderRetry", lang)}
                </button>
              ) : null}
            </div>
          )}
          {error ? <p className="text-[13px] text-danger">{t(error, lang)}</p> : null}
        </div>
      </footer>
    </div>
  );
}
