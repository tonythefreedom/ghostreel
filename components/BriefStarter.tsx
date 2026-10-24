"use client";
// After the game: the kept shorts as one choice. The chosen one picks how close the ghost stays (keep / adapt / twist)
// and the docked verb writes its brief: one red verb a screen, however many were kept. A locked deploy asks for the
// owner passcode once, then retries.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Intent, KeepPart } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";
import { Button, Verb } from "./ui";
import { Segmented } from "./taste/Segmented";
import { UnlockForm } from "./UnlockForm";
import { useLang } from "@/components/Lang";

export interface KeptItem {
  videoId: string;
  title: string;
  keep: KeepPart[];
  poster?: string;
}

const INTENTS: Intent[] = ["keep", "adapt", "twist"];
const INTENT_WORD = { keep: "intentKeep", adapt: "intentAdapt", twist: "intentTwist" } as const;

export function BriefStarter({ ghostId, creatorId, items, lang: langProp, back }: {
  ghostId: string;
  creatorId?: string;
  items: KeptItem[];
  lang?: UiLang;
  /** The one quiet secondary beside the verb (the way back to the deck). */
  back?: ReactNode;
}) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [intent, setIntent] = useState<Record<string, Intent>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = items.find((i) => i.videoId === selected) ?? items[0];

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 250);
    return () => clearInterval(id);
  }, [busy]);

  async function write(videoId: string) {
    setBusy(videoId);
    setFailed(null);
    setSeconds(0);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ghostId, videoId, intent: intent[videoId] ?? "adapt", creatorId }),
      });
      if (res.status === 401) return setLocked(videoId);
      const body = (await res.json()) as { brief?: { id: string }; error?: string };
      if (!res.ok || !body.brief) throw new Error(body.error ?? String(res.status));
      router.push(`/brief/${body.brief.id}`);
    } catch (e) {
      setFailed(`${videoId}:${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  const choose = (i: number) => {
    const item = items[i];
    if (busy || !item) return;
    setSelected(item.videoId);
    setLocked(null);
    setFailed(null);
  };
  const key = (e: KeyboardEvent, i: number) => {
    const n = items.length;
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i - 1 + n) % n : null;
    if (next === null) return;
    e.preventDefault();
    choose(next);
    refs.current[next]?.focus();
  };

  return (
    <>
      <div role="radiogroup" aria-label={t("keptTitle", lang)} className="flex flex-col gap-3">
        {items.map((item, i) => {
          const on = item.videoId === current?.videoId;
          return (
            <div key={item.videoId} className={`flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-3 ${on ? "ring-1 ring-inset ring-line-strong" : ""}`}>
              <button
                ref={(el) => { refs.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => key(e, i)}
                className="flex min-h-11 items-start gap-3 text-left"
              >
                {item.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element -- poster URLs come from Shorti answers, not a fixed host
                  <img src={item.poster} alt="" loading="lazy" referrerPolicy="no-referrer" className="aspect-[9/16] w-12 shrink-0 rounded-[var(--radius-badge)] bg-surface-2 object-cover" />
                ) : (
                  <span aria-hidden className="aspect-[9/16] w-12 shrink-0 rounded-[var(--radius-badge)] bg-surface-2" />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] font-[560] leading-snug text-text">{item.title}</span>
                  <span className="text-[13px] text-ghost">{item.keep.map((k) => t(k, lang)).join(" · ")}</span>
                </span>
                <span aria-hidden className={`w-4 text-center text-[15px] ${on ? "text-text" : "text-text-3"}`}>{on ? "●" : "○"}</span>
              </button>
              {on ? (
                <>
                  <Segmented
                    label={t("intentLabel", lang)}
                    options={INTENTS.map((v) => ({ value: v, label: t(INTENT_WORD[v], lang) }))}
                    value={intent[item.videoId] ?? "adapt"}
                    onChange={(v) => setIntent({ ...intent, [item.videoId]: v })}
                  />
                  {locked === item.videoId ? (
                    <UnlockForm
                      lang={lang}
                      onUnlocked={() => {
                        setLocked(null);
                        void write(item.videoId);
                      }}
                    />
                  ) : null}
                  {failed?.startsWith(`${item.videoId}:`) ? (
                    <p role="alert" className="text-[13px] leading-snug text-danger">
                      ✕ {t(failed.endsWith(":model_key_missing") ? "noModelKey" : "briefFailed", lang)}
                    </p>
                  ) : null}
                  {/* The other way to write it: the person's own Claude, through GhostReel's MCP server. */}
                  <p className="text-[12px] leading-snug text-text-3">
                    {t("orClaude", lang)}{" "}
                    <Link href="/connect" className="font-[640] text-text-dim underline decoration-accent/60 underline-offset-2 hover:text-text">{t("navConnect", lang)} →</Link>
                  </p>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <Verb>
        {back}
        <Button size="xl" aria-busy={busy !== null} disabled={!current || locked !== null} onClick={() => current && !busy && void write(current.videoId)}>
          {busy ? (
            <span className="font-mono">
              {t("writing", lang)} · {seconds}s
            </span>
          ) : (
            t("writeBrief", lang)
          )}
        </Button>
      </Verb>
    </>
  );
}
