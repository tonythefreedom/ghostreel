// Copy lives here, Korean first with English beside it. Plus the honest number and time formats.
export type UiLang = "ko" | "en";

export const words = {
  brand: { ko: "고스트릴", en: "GhostReel" },
  tasteTitle: { ko: "오늘의 감각 고르기", en: "Teach your taste" },
  tasteSub: {
    ko: "이번 주 해외에서 뜨는 숏폼이에요. 내 고스트가 따라 했으면 하는 것만 남기세요.",
    en: "Shorts rising abroad this week. Keep only what your ghost should learn from.",
  },
  keep: { ko: "남기기", en: "Keep" },
  skip: { ko: "넘기기", en: "Skip" },
  undo: { ko: "되돌리기", en: "Undo" },
  keepWhat: { ko: "무엇을 남길까요?", en: "What should the ghost keep?" },
  hook: { ko: "훅", en: "Hook" },
  beat: { ko: "흐름", en: "Beats" },
  look: { ko: "룩", en: "Look" },
  sound: { ko: "사운드", en: "Sound" },
  next: { ko: "다음", en: "Next" },
  done: { ko: "다 골랐어요", en: "Done" },
  kept: { ko: "남긴 영상", en: "Kept" },
  platformCount: { ko: "플랫폼 집계", en: "platform count" },
  readBy: { ko: "Shorti 읽음", en: "read by Shorti" },
  fixture: { ko: "기록된 데이터", en: "recorded data" },
  aiLabel: { ko: "AI-generated · Virtual human", en: "AI-generated · Virtual human" },
} as const satisfies Record<string, Record<UiLang, string>>;

export type WordKey = keyof typeof words;
export const t = (key: WordKey, lang: UiLang = "ko") => words[key][lang];

// Counts: at most three significant digits. KO uses 만/억, EN uses K/M/B. Never a forecast, only what was read.
export function viewCount(n: number, lang: UiLang = "ko"): string {
  const sig = (x: number) => (x >= 100 ? Math.round(x).toString() : x >= 10 ? x.toFixed(1).replace(/\.0$/, "") : x.toFixed(2).replace(/\.?0+$/, ""));
  if (lang === "ko") {
    if (n >= 1e8) return `${sig(n / 1e8)}억`;
    if (n >= 1e4) return `${sig(n / 1e4)}만`;
    return n.toLocaleString("ko-KR");
  }
  if (n >= 1e9) return `${sig(n / 1e9)}B`;
  if (n >= 1e6) return `${sig(n / 1e6)}M`;
  if (n >= 1e3) return `${sig(n / 1e3)}K`;
  return String(n);
}

// Dates in KST: «10.21» in KO, "Oct 21" in EN.
export function shortDate(iso: string, lang: UiLang = "ko"): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  const kst = new Date(d.getTime() + 9 * 3600_000);
  const m = kst.getUTCMonth();
  const day = kst.getUTCDate();
  return lang === "ko"
    ? `${m + 1}.${day}`
    : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m]} ${day}`;
}
