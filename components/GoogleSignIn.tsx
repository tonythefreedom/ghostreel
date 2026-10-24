"use client";
// Lane B. "Continue with Google" with CineSynth's own Google client: one account for GhostReel, CineSynth and its
// renders. The Google token goes straight to our server, which keeps the CineSynth session in an httpOnly cookie.
import { useEffect, useRef, useState } from "react";
import { GIS_SRC, type GoogleId } from "@/lib/newtype/gis";
import type { CinesynthAccount } from "@/lib/types";

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
            else setError("Sign-in didn't go through. Try again.");
          },
        });
        window.google.accounts.id.renderButton(slot.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
          locale: "en",
        });
      } catch {
        if (live) setError("Google sign-in couldn't load here. Check this site is an allowed origin for the client.");
      }
    })();
    return () => {
      live = false;
    };
  }, [onSignedIn]);

  return (
    <div className="flex flex-col items-start gap-2">
      <div ref={slot} className="min-h-11" aria-busy={busy} />
      {busy ? <p className="text-[13px] text-text-dim">Signing in…</p> : null}
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}
