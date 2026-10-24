"use client";
// What a refused owner-only action asks for: the Google sign-in, in place, then the action runs again.
// Ted, 10-24: «이사한 패스코드 이런거 걸리적거리면 안되고» — an approved CineSynth account is the owner of its own
// picks and briefs (lib/owner.ts), so the passcode is only the operator's fallback, folded away.
import { useCallback, useEffect, useState } from "react";
import type { CinesynthAccount } from "@/lib/types";
import { t, type UiLang } from "@/lib/words";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useLang } from "@/components/Lang";

// Once per page load: if this browser is already signed in and the action still came back locked, asking the
// session again would loop, so the sign-in shows instead.
let sessionTried = false;

export function UnlockForm({ onUnlocked, lang: langProp }: { onUnlocked: () => void; lang?: UiLang }) {
  const ctxLang = useLang();
  const lang = langProp ?? ctxLang;
  const [passcode, setPasscode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(!sessionTried);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (sessionTried) return;
    sessionTried = true;
    (async () => {
      const res = await fetch("/api/auth/session").catch(() => null);
      const body = res?.ok ? ((await res.json()) as { account: { status: string } | null }) : null;
      if (body?.account?.status === "approved") return onUnlocked();
      setPending(body?.account?.status === "pending");
      setChecking(false);
    })();
  }, [onUnlocked]);

  const signedIn = useCallback((account: CinesynthAccount) => {
    if (account.status === "approved") onUnlocked();
    else setPending(true);
  }, [onUnlocked]);

  async function submit() {
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (!res.ok) {
      setWrong(true);
      setPasscode("");
      return;
    }
    onUnlocked();
  }

  if (checking) return <p className="text-[13px] text-text-dim">{t("unlockChecking", lang)}</p>;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-[15px] font-[720] text-text">{t("signInToGo", lang)}</p>
        <p className={`text-[13px] leading-snug ${pending ? "text-warn" : "text-text-dim"}`}>{t(pending ? "signInPending" : "signInToGoLine", lang)}</p>
      </div>
      {pending ? null : <GoogleSignIn onSignedIn={signedIn} />}
      <details className="group">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1 text-[12px] text-text-3 hover:text-text-dim [&::-webkit-details-marker]:hidden">
          {t("operatorPasscode", lang)} <span aria-hidden className="transition-transform duration-[125ms] group-open:rotate-90">›</span>
        </summary>
        <form
          className="flex flex-col gap-1.5 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {wrong ? <p className="text-[12px] text-warn">{t("wrongPasscode", lang)}</p> : null}
          <div className="flex gap-2">
            <input
              type="password"
              autoComplete="current-password"
              aria-label={t("operatorPasscode", lang)}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] bg-surface-2 px-3 text-[15px] ring-1 ring-inset ring-line focus:ring-line-strong"
            />
            <button type="submit" className="h-10 rounded-[var(--radius-control)] bg-surface-2 px-4 text-[13px] font-[640] ring-1 ring-inset ring-line hover:bg-pressed">
              {t("unlock", lang)}
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
