"use client";
// Lane B. "Continue with Google" with CineSynth's own Google client: one account for GhostReel, CineSynth and its
// renders. The Google token goes straight to our server, which keeps the CineSynth session in an httpOnly cookie.
import { useEffect, useRef, useState } from "react";
import { GIS_SRC, type GoogleId } from "@/lib/newtype/gis";
import type { CinesynthAccount } from "@/lib/types";
import { useLang, useT } from "./Lang";

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const s = existing ?? Object.assign(document.createElement("script"), { src: GIS_SRC, async: true });
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("google script")));
    if (!existing) document.head.appendChild(s);
  });
}

export function GoogleSignIn({ onSignedIn }: { onSignedIn: (account: CinesynthAccount) => void }) {
  const lang = useLang();
  const t = useT();
  const words = useRef({ failed: t("signInFailed"), noLoad: t("signInNoLoad") });
  words.current = { failed: t("signInFailed"), noLoad: t("signInNoLoad") };
  const slot = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { clientId } = (await (await fetch("/api/auth/session")).json()) as { clientId: string | null };
        if (!clientId) throw new Error("no client id");
        await loadScript();
        if (!live || !slot.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: async ({ credential }) => {
            setBusy(true);
            setError(null);
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const body = (await res.json().catch(() => ({}))) as { account?: CinesynthAccount };
            setBusy(false);
            if (res.ok && body.account) onSignedIn(body.account);
            else setError(words.current.failed);
          },
        });
        window.google.accounts.id.renderButton(slot.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          // Google draws the button at a fixed width (200–400 px): the room it has here.
          width: Math.max(200, Math.min(400, Math.floor(slot.current.getBoundingClientRect().width || 320))),
          locale: lang,
        });
      } catch {
        if (live) setError(words.current.noLoad);
      }
    })();
    return () => {
      live = false;
    };
  }, [onSignedIn, lang]);

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div ref={slot} className="min-h-11 w-full" aria-busy={busy} />
      {busy ? <p className="text-[13px] text-text-dim">{t("signingIn")}</p> : null}
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}
