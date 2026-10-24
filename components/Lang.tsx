"use client";
// Lane A. The page's language on the client, handed down once from the layout (lib/lang.ts), and the KO/EN key that
// changes it: a year-long cookie, then the server draws the page again in the other language. Nothing is lost on the
// page: a refresh keeps client state.
import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";
import { t as word, type UiLang, type WordKey } from "@/lib/words";

const LangContext = createContext<UiLang>("en");

export function LangProvider({ lang, children }: { lang: UiLang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** The page's words in its language: `const t = useT(); t("keep")`. */
export function useT() {
  const lang = useLang();
  return (key: WordKey) => word(key, lang);
}

export function LangToggle() {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (next: UiLang) => {
    if (next === lang) return;
    document.cookie = `gr_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    start(() => router.refresh());
  };
  return (
    <div role="group" aria-label={lang === "ko" ? "언어" : "Language"} aria-busy={pending}
      className="flex h-10 items-center rounded-full p-0.5 ring-1 ring-inset ring-line">
      {(["ko", "en"] as const).map((l) => (
        <button key={l} type="button" onClick={() => set(l)} aria-pressed={lang === l}
          className={`h-9 min-w-10 rounded-full px-2.5 text-[12px] font-[640] tracking-[0.02em] transition-colors duration-[125ms] ${
            lang === l ? "bg-surface-2 text-text" : "text-text-3 hover:text-text-dim"
          }`}>
          {l === "ko" ? "한" : "EN"}
        </button>
      ))}
    </div>
  );
}
