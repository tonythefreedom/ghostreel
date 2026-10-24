// Lane A. Which language a page speaks: the person's own choice (the KO/EN key in the top bar, a cookie), else their
// browser's first language when it is Korean, else English. Server only; client components read it through
// components/Lang.tsx.
import "server-only";
import { cookies, headers } from "next/headers";
import { langFromAccept, type UiLang } from "./words.ts";

export const LANG_COOKIE = "gr_lang";

export async function getLang(): Promise<UiLang> {
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  if (chosen === "ko" || chosen === "en") return chosen;
  return langFromAccept((await headers()).get("accept-language"));
}
