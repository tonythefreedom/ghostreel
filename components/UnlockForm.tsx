"use client";
// One passcode prompt for every owner-only action; calls back once the owner cookie is set.
import { useState } from "react";
import { t, type UiLang } from "@/lib/words";

export function UnlockForm({ onUnlocked, lang = "ko" }: { onUnlocked: () => void; lang?: UiLang }) {
  const [passcode, setPasscode] = useState("");
  const [wrong, setWrong] = useState(false);

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
    </form>
  );
}
