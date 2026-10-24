// How long the ghost's spoken lines take, roughly. Pure, so the prompt, the editor and tests share one estimate.
// TTS length is measured for real by the renderer; this only keeps a 10 or 15 s brief from being overwritten.
import type { BriefLine, Lang } from "./types.ts";

const WORDS_PER_SEC: Record<Lang, number> = { en: 2.6, es: 2.8, ko: 0, ja: 0 };
const CHARS_PER_SEC: Record<Lang, number> = { en: 0, es: 0, ko: 6.5, ja: 7.5 };
const spacedLanguage = (lang: Lang) => WORDS_PER_SEC[lang] > 0;

export function speechSeconds(lines: Pick<BriefLine, "say">[], lang: Lang): number {
  const text = lines.map((l) => l.say).join(" ").trim();
  if (!text) return 0;
  if (spacedLanguage(lang)) return text.split(/\s+/).length / WORDS_PER_SEC[lang];
  return text.replace(/\s+/g, "").length / CHARS_PER_SEC[lang];
}

/** The spoken budget for a duration, leaving room for the hook's beat and the ending. */
export function speechBudget(durationSec: number, lang: Lang): { seconds: number; words?: number; chars?: number } {
  const seconds = durationSec * 0.8;
  return spacedLanguage(lang)
    ? { seconds, words: Math.floor(seconds * WORDS_PER_SEC[lang]) }
    : { seconds, chars: Math.floor(seconds * CHARS_PER_SEC[lang]) };
}
