"use client";
// One passcode prompt for every owner-only action; calls back once the owner cookie is set.
// Tony (10-24): an approved CineSynth account is the owner. Before asking for the passcode, check the Google sign-in:
// the session route sets the owner cookie for an approved account, and the action that was refused runs again.
import Link from "next/link";
import { useEffect, useState } from "react";
import { t, type UiLang } from "@/lib/words";

// Once per page load: if the session already made this browser the owner and the action still came back locked,
// asking again would loop, so the passcode prompt shows instead.
let sessionTried = false;

export function UnlockForm({ onUnlocked, lang = "en" }: { onUnlocked: () => void; lang?: UiLang }) {
  const [passcode, setPasscode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(!sessionTried);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (sessionTried) return;
    sessionTried = true;
    (async () => {
      const res = await fetch("/api/auth/session").catch(() => null);
      const body = res?.ok ? ((await res.json()) as { account: { status: string } | null }) : null;
      if (body?.account?.status === "approved") {
        setSignedIn(true);
        onUnlocked(); // the session route has set the owner cookie
        return;
      }
      setChecking(false);
    })();
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

  if (checking) return <p className="text-[13px] text-text-dim">Checking your sign-in…</p>;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-[13px] text-warn">{t(wrong ? "wrongPasscode" : "locked", lang)}</p>
      <div className="flex gap-2">
        <input
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-[var(--radius-card)] border border-line bg-bg px-3 text-[15px]"
        />
        <button type="submit" className="h-11 rounded-[var(--radius-card)] bg-surface-2 px-4 font-semibold">
          {t("unlock", lang)}
        </button>
      </div>
      {signedIn ? null : (
        <p className="text-[13px] text-text-dim">
          No passcode?{" "}
          <Link href="/onboard" className="text-text underline decoration-line underline-offset-2">Sign in with Google</Link>{" "}
          in this browser with an approved account, then come back.
        </p>
      )}
    </form>
  );
}
