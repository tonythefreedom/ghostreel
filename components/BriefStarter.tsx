"use client";
// After the game: for each kept short, pick how close the ghost stays (keep / adapt / twist) and write the brief.
// A locked deploy asks for the owner passcode once, then retries.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Intent, KeepPart } from "@/lib/types";
import { t, type UiLang, type WordKey } from "@/lib/words";
import { UnlockForm } from "./UnlockForm";

export interface KeptItem {
  videoId: string;
  title: string;
  keep: KeepPart[];
}

const INTENTS: Array<[Intent, WordKey]> = [["keep", "intentKeep"], ["adapt", "intentAdapt"], ["twist", "intentTwist"]];

export function BriefStarter({ ghostId, items, lang = "ko" }: { ghostId: string; items: KeptItem[]; lang?: UiLang }) {
  const router = useRouter();
  const [intent, setIntent] = useState<Record<string, Intent>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

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
        body: JSON.stringify({ ghostId, videoId, intent: intent[videoId] ?? "adapt" }),
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

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const chosen = intent[item.videoId] ?? "adapt";
        const isBusy = busy === item.videoId;
        return (
          <li key={item.videoId} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-semibold">{item.title}</p>
              <span className="shrink-0 text-[12px] text-ghost">{item.keep.map((k) => t(k, lang)).join(" · ")}</span>
            </div>
            <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-full bg-bg p-1">
              {INTENTS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={chosen === value}
                  onClick={() => setIntent({ ...intent, [item.videoId]: value })}
                  className={`h-9 rounded-full text-[13px] font-semibold ${chosen === value ? "bg-surface-2 text-text" : "text-text-dim"}`}
                >
                  {t(label, lang)}
                </button>
              ))}
            </div>
            {locked === item.videoId ? (
              <UnlockForm
                lang={lang}
                onUnlocked={() => {
                  setLocked(null);
                  void write(item.videoId);
                }}
              />
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void write(item.videoId)}
                className="relative h-12 overflow-hidden rounded-[var(--radius-card)] bg-accent font-extrabold disabled:opacity-60"
              >
                {isBusy ? (
                  <span className="font-mono">
                    {t("writing", lang)} · {seconds}s
                  </span>
                ) : (
                  t("writeBrief", lang)
                )}
              </button>
            )}
            {failed?.startsWith(`${item.videoId}:`) ? (
              <p className="text-[13px] text-danger">{t(failed.endsWith(":model_key_missing") ? "noModelKey" : "briefFailed", lang)}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
